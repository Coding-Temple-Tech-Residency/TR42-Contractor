from flask import request, jsonify
from app.models import db, Contractor
from sqlalchemy import text
from . import analytics_bp
from app.util.auth import token_required


def _parse_contractor_id(raw):
    """Safely parse contractor_id; returns (int, None) or (None, error_response)."""
    if not raw:
        return None, (jsonify({'error': 'contractor_id is required'}), 400)
    try:
        return int(raw), None
    except (ValueError, TypeError):
        return None, (jsonify({'error': 'contractor_id must be a valid integer'}), 400)


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
    contractor_id, err_resp = _parse_contractor_id(request.args.get('contractor_id'))
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

    # 1.2 Completed Jobs
    # NOTE: status is uppercase enum per models.py
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
    # NOTE: geofenceverified / biometricverified don't exist on ticket.
    # anomaly_flag is the correct column.
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
    # NOTE: contractorperformance table doesn't exist.
    # average_rating is a scalar field on the contractor table.
    avg_rating, err = _execute_query(
        "SELECT ROUND(average_rating::NUMERIC, 2) AS avg_rating FROM contractor WHERE id = :contractor_id",
        params
    )
    if err:
        return jsonify({'error': f'Average rating query failed: {err}'}), 500

    # 1.6 Total Earnings — BLOCKED
    # freightamount / paymentstatus don't exist in models.py.
    # Returning null until the schema decision is made.
    total_earnings_value = None

    return jsonify({
        'total_jobs': total_jobs[0]['total_jobs'] if total_jobs else 0,
        'completed_jobs': completed_jobs[0]['completed_jobs'] if completed_jobs else 0,
        'completion_rate': float(completion_rate[0]['completion_rate'] or 0) if completion_rate else 0,
        'flag_rate': float(flag_rate[0]['flag_rate'] or 0) if flag_rate else 0,
        'avg_rating': float(avg_rating[0]['avg_rating'] or 0) if avg_rating else 0,
        'total_earnings': total_earnings_value,   # null until freight columns land
    }), 200


# =================================================================
# PART 2: JOB HISTORY TABLE
# =================================================================

@analytics_bp.route('/jobs', methods=['GET'])
@token_required
def get_job_history():
    """Get paginated job history for the authenticated contractor."""
    contractor_id, err_resp = _parse_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 20, type=int), 100)  # cap at 100
    offset = (page - 1) * limit

    params = {'contractor_id': contractor_id, 'limit': limit, 'offset': offset}

    job_history_query = """
    SELECT
        t.id,
        t.description,
        t.route,
        t.service_type,
        t.status,
        t.anomaly_flag,
        t.anomaly_reason,
        t.start_time,
        t.end_time,
        t.approved_at,
        t.rejected_at,
        t.created_at
    FROM ticket t
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
    contractor_id, err_resp = _parse_contractor_id(request.args.get('contractor_id'))
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
    # NOTE: freightamount removed — not in models.py.
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

    # Anomaly rate trend (replaces rating trend — no per-ticket rating or history table)
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
        'anomaly_trend': anomaly_trend,
        # monthly_earnings: blocked — freight_amount not in schema yet
        # rating_trend: blocked — no per-record rating history table
    }), 200


@analytics_bp.route('/performance/distribution', methods=['GET'])
@token_required
def get_performance_distribution():
    """Get jobs by route type and status for the authenticated contractor."""
    contractor_id, err_resp = _parse_contractor_id(request.args.get('contractor_id'))
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
    contractor_id, err_resp = _parse_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # NOTE: table is auth_user (not auth_users).
    # Columns: first_name / last_name (not firstname/lastname).
    # Join via contractor.user_id, NOT contractor.id == auth_user.id.
    profile_query = """
    SELECT
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.username,
        u.contact_number,
        u.profile_photo,
        u.is_active,
        c.id AS contractor_id,
        c.role,
        c.status AS contractor_status,
        c.employee_number,
        c.average_rating,
        c.years_experience,
        c.is_licensed,
        c.is_insured,
        c.is_certified,
        c.biometric_enrolled,
        c.tickets_completed,
        c.tickets_open
    FROM auth_user u
    JOIN contractor c ON u.id = c.user_id
    WHERE c.id = :contractor_id
    """
    profile, err = _execute_query(profile_query, params)
    if err:
        return jsonify({'error': f'Profile query failed: {err}'}), 500

    if not profile:
        return jsonify({'error': 'Contractor not found'}), 404

    # Compliance flags — licenses/insurance/background-check detail tables
    # do not exist in models.py. Returning the boolean flags that do exist.
    compliance_query = """
    SELECT is_licensed, is_insured, is_certified, biometric_enrolled
    FROM contractor WHERE id = :contractor_id
    """
    compliance, err = _execute_query(compliance_query, params)
    if err:
        return jsonify({'error': f'Compliance query failed: {err}'}), 500

    return jsonify({
        'profile': profile[0],
        'compliance_flags': compliance[0] if compliance else {},
        # 'certifications': blocked — licenses/insurance/background detail tables
        #   don't exist in models.py yet.
    }), 200


# =================================================================
# PART 5: NOTIFICATIONS
# =================================================================

@analytics_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications():
    """Get notifications for the authenticated contractor."""
    contractor_id, err_resp = _parse_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # NOTE: notifications.user_id is a FK to auth_user, not contractor.
    # The column is is_read (not isread), created_at (not createdat).
    # Join through contractor to get the auth_user's user_id.
    unread, err = _execute_query(
        """SELECT COUNT(*) AS unread_count
           FROM notifications n
           JOIN contractor c ON c.user_id = n.user_id
           WHERE c.id = :contractor_id AND n.is_read = FALSE""",
        params
    )
    if err:
        return jsonify({'error': f'Unread count query failed: {err}'}), 500

    recent, err = _execute_query(
        """SELECT n.id, n.title, n.message, n.type, n.is_read, n.created_at
           FROM notifications n
           JOIN contractor c ON c.user_id = n.user_id
           WHERE c.id = :contractor_id
           ORDER BY n.created_at DESC LIMIT 10""",
        params
    )
    if err:
        return jsonify({'error': f'Recent notifications query failed: {err}'}), 500

    return jsonify({
        'unread_count': unread[0]['unread_count'] if unread else 0,
        'recent_notifications': recent,
    }), 200


# =================================================================
# PART 6: ACTIVE WORK
# =================================================================

@analytics_bp.route('/active-work', methods=['GET'])
@token_required
def get_active_work():
    """Get active tickets for the authenticated contractor."""
    contractor_id, err_resp = _parse_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # NOTE: status values are uppercase. 'accepted', 'in_transit', 'arrived'
    # don't match models.py — closest equivalents are ASSIGNED / IN_PROGRESS.
    # If the mobile team uses different intermediate statuses, align with them here.
    active_query = """
    SELECT
        t.id,
        t.description,
        t.route,
        t.service_type,
        t.status,
        t.start_time,
        t.due_date,
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
