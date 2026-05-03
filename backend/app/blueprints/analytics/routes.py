from flask import request, jsonify
from app.models import db, Contractor
from sqlalchemy import text
from . import analytics_bp
from app.util.auth import token_required


def _validate_contractor_id(raw):
    """
    Validate that contractor_id is a non-empty string.
    All PKs in the schema are TEXT (UUIDs) — never cast to int.
    Returns (str, None) on success or (None, error_response) on failure.
    """
    if not raw or not raw.strip():
        return None, (jsonify({'error': 'contractor_id is required'}), 400)
    return raw.strip(), None


def _get_authenticated_contractor(user_id):
    """Return the Contractor row for the authenticated user, or None."""
    return db.session.query(Contractor).filter(Contractor.user_id == user_id).first()


def _check_ownership(authenticated_contractor, requested_contractor_id):
    """Return an error response if the token owner doesn't own the requested resource."""
    if authenticated_contractor is None:
        return jsonify({'error': 'No contractor record associated with this account'}), 403
    if authenticated_contractor.id != requested_contractor_id:
        return jsonify({'error': 'Forbidden: you may only access your own analytics'}), 403
    return None


def _execute_query(query, params=None):
    """Execute raw SQL and return (rows, None) or (None, error_string)."""
    try:
        result = db.session.execute(text(query), params or {})
        columns = list(result.keys())
        rows = [dict(zip(columns, row)) for row in result]
        return rows, None
    except Exception as e:
        return None, str(e)


# =================================================================
# PART 1: CONTRACTOR DASHBOARD - STATS CARDS
# =================================================================

@analytics_bp.route('/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats():
    """Get dashboard stats cards for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    # IDOR fix: verify the token owner is the requested contractor
    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # 1.1 Total Jobs
    total_jobs, err = _execute_query(
        "SELECT COUNT(*) AS total_jobs FROM ticket WHERE assigned_contractor = :contractor_id",
        params
    )
    if err:
        return jsonify({'error': f'Total jobs query failed: {err}'}), 500

    # 1.2 Completed Jobs (status enum is uppercase per schema)
    completed_jobs, err = _execute_query(
        """SELECT COUNT(*) AS completed_jobs FROM ticket
           WHERE assigned_contractor = :contractor_id AND status = 'COMPLETED'""",
        params
    )
    if err:
        return jsonify({'error': f'Completed jobs query failed: {err}'}), 500

    # 1.3 Completion Rate
    completion_rate, err = _execute_query(
        """SELECT ROUND(
               COUNT(*) FILTER (WHERE status = 'COMPLETED')::NUMERIC /
               NULLIF(COUNT(*), 0) * 100, 2
           ) AS completion_rate
           FROM ticket WHERE assigned_contractor = :contractor_id""",
        params
    )
    if err:
        return jsonify({'error': f'Completion rate query failed: {err}'}), 500

    # 1.4 Anomaly Flag Rate
    # anomaly_flag is the correct column on ticket.
    # geofenceverified / biometricverified do NOT exist in the schema.
    flag_rate, err = _execute_query(
        """SELECT ROUND(
               COUNT(*) FILTER (WHERE anomaly_flag = TRUE)::NUMERIC /
               NULLIF(COUNT(*), 0) * 100, 2
           ) AS flag_rate
           FROM ticket
           WHERE assigned_contractor = :contractor_id AND status = 'COMPLETED'""",
        params
    )
    if err:
        return jsonify({'error': f'Flag rate query failed: {err}'}), 500

    # 1.5 Average Rating
    # contractor_performance EXISTS in the ERD with (contractor_id, ticket_id, rating integer).
    # Using live average from contractor_performance.
    avg_rating, err = _execute_query(
        """SELECT ROUND(AVG(cp.rating)::NUMERIC, 2) AS avg_rating
           FROM contractor_performance cp
           WHERE cp.contractor_id = :contractor_id""",
        params
    )
    if err:
        return jsonify({'error': f'Average rating query failed: {err}'}), 500

    # 1.6 Total Earnings — BLOCKED
    # freight_amount / payment_status do not exist in the schema.
    total_earnings_value = None

    return jsonify({
        'total_jobs': total_jobs[0]['total_jobs'] if total_jobs else 0,
        'completed_jobs': completed_jobs[0]['completed_jobs'] if completed_jobs else 0,
        'completion_rate': float(completion_rate[0]['completion_rate'] or 0) if completion_rate else 0,
        'flag_rate': float(flag_rate[0]['flag_rate'] or 0) if flag_rate else 0,
        'avg_rating': float(avg_rating[0]['avg_rating'] or 0) if avg_rating else 0,
        'total_earnings': total_earnings_value,
    }), 200


# =================================================================
# PART 2: JOB HISTORY TABLE
# =================================================================

@analytics_bp.route('/jobs', methods=['GET'])
@token_required
def get_job_history():
    """Get paginated job history for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 20, type=int), 100)
    offset = (page - 1) * limit

    params = {'contractor_id': contractor_id, 'limit': limit, 'offset': offset}

    job_history_query = """
    SELECT
        t.id,
        t.description,
        t.route,
        t.service_type,
        t.status,
        t.priority,
        t.anomaly_flag,
        t.anomaly_reason,
        t.start_time,
        t.end_time,
        t.due_date,
        t.approved_at,
        t.rejected_at,
        t.created_at,
        t.contractor_start_latitude,
        t.contractor_start_longitude,
        t.contractor_end_latitude,
        t.contractor_end_longitude,
        cp.rating   AS performance_rating,
        cp.comments AS performance_comments
    FROM ticket t
    LEFT JOIN contractor_performance cp ON cp.ticket_id = t.id
    WHERE t.assigned_contractor = :contractor_id
    ORDER BY t.created_at DESC
    LIMIT :limit OFFSET :offset
    """
    jobs, err = _execute_query(job_history_query, params)
    if err:
        return jsonify({'error': f'Job history query failed: {err}'}), 500

    count_result, err = _execute_query(
        "SELECT COUNT(*) AS total_count FROM ticket WHERE assigned_contractor = :contractor_id",
        {'contractor_id': contractor_id}
    )
    if err:
        return jsonify({'error': f'Count query failed: {err}'}), 500

    total = count_result[0]['total_count'] if count_result else 0

    return jsonify({
        'jobs': jobs,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'total_pages': (total + limit - 1) // limit if total else 0,
        }
    }), 200


# =================================================================
# PART 3: PERFORMANCE CHARTS
# =================================================================

@analytics_bp.route('/performance/trends', methods=['GET'])
@token_required
def get_performance_trends():
    """Get monthly performance trends for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # Monthly job volume
    monthly_jobs, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', t.created_at) AS month,
               COUNT(*) AS job_count,
               COUNT(*) FILTER (WHERE t.status = 'COMPLETED') AS completed_count,
               COUNT(*) FILTER (WHERE t.status IN ('ASSIGNED', 'IN_PROGRESS')) AS active_count
           FROM ticket t
           WHERE t.assigned_contractor = :contractor_id
           GROUP BY DATE_TRUNC('month', t.created_at)
           ORDER BY month DESC LIMIT 12""",
        params
    )
    if err:
        return jsonify({'error': f'Monthly jobs query failed: {err}'}), 500

    # Monthly completions by end_time
    monthly_completions, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', t.end_time) AS month,
               COUNT(*) AS completed_count
           FROM ticket t
           WHERE t.assigned_contractor = :contractor_id
             AND t.status = 'COMPLETED'
             AND t.end_time IS NOT NULL
           GROUP BY DATE_TRUNC('month', t.end_time)
           ORDER BY month DESC LIMIT 12""",
        params
    )
    if err:
        return jsonify({'error': f'Monthly completions query failed: {err}'}), 500

    # Rating trend — NOW FULLY SUPPORTED via contractor_performance table (exists in ERD)
    rating_trend, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', cp.created_at) AS month,
               ROUND(AVG(cp.rating)::NUMERIC, 2)  AS avg_rating,
               COUNT(*)                            AS rating_count
           FROM contractor_performance cp
           WHERE cp.contractor_id = :contractor_id
           GROUP BY DATE_TRUNC('month', cp.created_at)
           ORDER BY month DESC LIMIT 12""",
        params
    )
    if err:
        return jsonify({'error': f'Rating trend query failed: {err}'}), 500

    # Anomaly rate trend
    anomaly_trend, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', t.created_at) AS month,
               ROUND(
                   COUNT(*) FILTER (WHERE t.anomaly_flag = TRUE)::NUMERIC /
                   NULLIF(COUNT(*), 0) * 100, 2
               ) AS anomaly_rate_pct,
               COUNT(*) AS total_tickets
           FROM ticket t
           WHERE t.assigned_contractor = :contractor_id
           GROUP BY DATE_TRUNC('month', t.created_at)
           ORDER BY month DESC LIMIT 12""",
        params
    )
    if err:
        return jsonify({'error': f'Anomaly trend query failed: {err}'}), 500

    return jsonify({
        'monthly_jobs': monthly_jobs,
        'monthly_completions': monthly_completions,
        'rating_trend': rating_trend,
        'anomaly_trend': anomaly_trend,
        # monthly_earnings: blocked — freight_amount not in schema
    }), 200


@analytics_bp.route('/performance/distribution', methods=['GET'])
@token_required
def get_performance_distribution():
    """Get jobs by route type and status for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    by_route, err = _execute_query(
        """SELECT t.route, COUNT(*) AS job_count
           FROM ticket t
           WHERE t.assigned_contractor = :contractor_id AND t.route IS NOT NULL
           GROUP BY t.route ORDER BY job_count DESC""",
        params
    )
    if err:
        return jsonify({'error': f'Jobs by route query failed: {err}'}), 500

    by_status, err = _execute_query(
        """SELECT t.status, COUNT(*) AS job_count
           FROM ticket t
           WHERE t.assigned_contractor = :contractor_id
           GROUP BY t.status ORDER BY job_count DESC""",
        params
    )
    if err:
        return jsonify({'error': f'Jobs by status query failed: {err}'}), 500

    return jsonify({'by_route': by_route, 'by_status': by_status}), 200


# =================================================================
# PART 4: CONTRACTOR PROFILE DATA
# =================================================================

@analytics_bp.route('/profile', methods=['GET'])
@token_required
def get_contractor_profile():
    """Get profile details for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # auth_user confirmed: first_name, last_name, contact_number, email, username, is_active.
    # profile_photo is bytea — not served here; use a separate endpoint if needed.
    # Join via contractor.user_id → auth_user.id.
    profile_query = """
    SELECT
        u.id               AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.username,
        u.contact_number,
        u.is_active,
        c.id               AS contractor_id,
        c.role,
        c.status           AS contractor_status,
        c.employee_number,
        c.average_rating,
        c.years_experience,
        c.is_licensed,
        c.is_insured,
        c.is_certified,
        c.biometric_enrolled,
        c.tickets_completed,
        c.tickets_open,
        c.is_onboarded,
        c.is_subcontractor,
        c.is_fte
    FROM auth_user u
    JOIN contractor c ON u.id = c.user_id
    WHERE c.id = :contractor_id
    """
    profile, err = _execute_query(profile_query, params)
    if err:
        return jsonify({'error': f'Profile query failed: {err}'}), 500
    if not profile:
        return jsonify({'error': 'Contractor not found'}), 404

    # Licenses — license table exists in schema
    licenses, err = _execute_query(
        """SELECT id, license_type, license_number, license_state,
                  license_expiration_date, license_verified, license_verified_at
           FROM license WHERE contractor_id = :contractor_id
           ORDER BY license_expiration_date DESC""",
        params
    )
    if err:
        return jsonify({'error': f'Licenses query failed: {err}'}), 500

    # Certifications — certification table exists in schema
    certifications, err = _execute_query(
        """SELECT id, certification_name, certifying_body, certification_number,
                  issue_date, expiration_date, certification_verified
           FROM certification WHERE contractor_id = :contractor_id
           ORDER BY expiration_date DESC""",
        params
    )
    if err:
        return jsonify({'error': f'Certifications query failed: {err}'}), 500

    # Insurance — insurance table exists in schema
    insurance_records, err = _execute_query(
        """SELECT id, insurance_type, policy_number, provider_name, coverage_amount,
                  effective_date, expiration_date, insurance_verified,
                  additional_insurance_required
           FROM insurance WHERE contractor_id = :contractor_id
           ORDER BY expiration_date DESC""",
        params
    )
    if err:
        return jsonify({'error': f'Insurance query failed: {err}'}), 500

    # Background check — most recent
    bg_check, err = _execute_query(
        """SELECT id, background_check_passed, background_check_date, background_check_provider
           FROM background_check WHERE contractor_id = :contractor_id
           ORDER BY background_check_date DESC LIMIT 1""",
        params
    )
    if err:
        return jsonify({'error': f'Background check query failed: {err}'}), 500

    # Drug test — most recent
    drug_test, err = _execute_query(
        """SELECT id, drug_test_passed, drug_test_date
           FROM drug_test WHERE contractor_id = :contractor_id
           ORDER BY drug_test_date DESC LIMIT 1""",
        params
    )
    if err:
        return jsonify({'error': f'Drug test query failed: {err}'}), 500

    return jsonify({
        'profile': profile[0],
        'licenses': licenses,
        'certifications': certifications,
        'insurance': insurance_records,
        'background_check': bg_check[0] if bg_check else None,
        'drug_test': drug_test[0] if drug_test else None,
    }), 200


# =================================================================
# PART 5: NOTIFICATIONS
# =================================================================
#
# SCHEMA NOTES:
#   Table: notification (singular, NOT notifications)
#   Columns: id, message, recipient (text), level (SUCCESS/DANGER/INFO), created_at
#   NO is_read column — unread count is NOT supported by the current schema.
#   NO title column. NO type column. NO user_id column.
#   recipient is a plain text field assumed to store auth_user.id.

@analytics_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications():
    """Get notifications for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # Join contractor → auth_user to resolve recipient (assumed to be auth_user.id).
    # Note: is_read does not exist in the schema — cannot filter unread.
    recent, err = _execute_query(
        """SELECT n.id, n.message, n.level, n.created_at
           FROM notification n
           JOIN contractor c ON c.user_id = n.recipient
           WHERE c.id = :contractor_id
           ORDER BY n.created_at DESC LIMIT 20""",
        params
    )
    if err:
        return jsonify({'error': f'Notifications query failed: {err}'}), 500

    total, err = _execute_query(
        """SELECT COUNT(*) AS total_notifications
           FROM notification n
           JOIN contractor c ON c.user_id = n.recipient
           WHERE c.id = :contractor_id""",
        params
    )
    if err:
        return jsonify({'error': f'Notification count query failed: {err}'}), 500

    return jsonify({
        'notifications': recent,
        'total': total[0]['total_notifications'] if total else 0,
        # unread_count: not available — is_read column does not exist in schema
    }), 200


# =================================================================
# PART 6: ACTIVE WORK
# =================================================================

@analytics_bp.route('/active-work', methods=['GET'])
@token_required
def get_active_work():
    """Get active tickets for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # Status enum values from schema: UNASSIGNED, ASSIGNED, IN_PROGRESS,
    # COMPLETED, PENDING_APPROVAL, APPROVED, REJECTED
    active_query = """
    SELECT
        t.id,
        t.description,
        t.route,
        t.service_type,
        t.status,
        t.priority,
        t.start_time,
        t.due_date,
        t.estimated_duration,
        t.contractor_start_latitude,
        t.contractor_start_longitude,
        t.contractor_end_latitude,
        t.contractor_end_longitude,
        t.anomaly_flag,
        w.description AS work_order_description
    FROM ticket t
    LEFT JOIN work_order w ON t.work_order_id = w.id
    WHERE t.assigned_contractor = :contractor_id
      AND t.status IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL')
    ORDER BY t.start_time DESC
    """
    active, err = _execute_query(active_query, params)
    if err:
        return jsonify({'error': f'Active work query failed: {err}'}), 500

    return jsonify({
        'active_tickets': active,
        'count': len(active) if active else 0,
    }), 200
