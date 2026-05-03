from flask import request, jsonify
from app.models import db, Contractor
from sqlalchemy import text
from . import analytics_bp
from app.util.auth import token_required

# ============================================================
# Source of truth: LIVE Supabase DB (whjtahksprbdzwdedfas)
# Inspected May 2026 via REST API.
#
# Live table names are PLURAL:
#   tickets, work_orders, contractors, vendors, clients,
#   notifications, performance_ratings, payments, shifts
#
# contractors.id == auth_user.id (same UUID — contractors PK is a FK to auth_user)
# All PKs are UUID (text) — never cast to int.
# notifications has: user_id (FK auth_user.id), title, message, type, is_read
# performance_ratings uses overall_score (not rating integer)
# tickets uses designated_route (not route), start_location/end_location (not lat/lng)
# ============================================================


def _validate_contractor_id(raw):
    """
    Validate contractor_id is a non-empty string UUID.
    All PKs in the live DB are UUID text — never cast to int.
    Returns (str, None) on success or (None, error_response) on failure.
    """
    if not raw or not raw.strip():
        return None, (jsonify({'error': 'contractor_id is required'}), 400)
    return raw.strip(), None


def _get_authenticated_contractor(user_id):
    """Return the Contractor row for the authenticated user, or None."""
    return db.session.query(Contractor).filter(Contractor.id == user_id).first()


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

    # 1.1 Total Jobs — live table: tickets (plural)
    total_jobs, err = _execute_query(
        "SELECT COUNT(*) AS total_jobs FROM tickets WHERE assigned_contractor = :contractor_id",
        params
    )
    if err:
        return jsonify({'error': f'Total jobs query failed: {err}'}), 500

    # 1.2 Completed Jobs — UPPER() guard since live DB status is plain text
    completed_jobs, err = _execute_query(
        """SELECT COUNT(*) AS completed_jobs FROM tickets
           WHERE assigned_contractor = :contractor_id AND UPPER(status) = 'COMPLETED'""",
        params
    )
    if err:
        return jsonify({'error': f'Completed jobs query failed: {err}'}), 500

    # 1.3 Completion Rate
    completion_rate, err = _execute_query(
        """SELECT ROUND(
               COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED')::NUMERIC /
               NULLIF(COUNT(*), 0) * 100, 2
           ) AS completion_rate
           FROM tickets WHERE assigned_contractor = :contractor_id""",
        params
    )
    if err:
        return jsonify({'error': f'Completion rate query failed: {err}'}), 500

    # 1.4 Anomaly Flag Rate
    flag_rate, err = _execute_query(
        """SELECT ROUND(
               COUNT(*) FILTER (WHERE anomaly_flag = TRUE)::NUMERIC /
               NULLIF(COUNT(*), 0) * 100, 2
           ) AS flag_rate
           FROM tickets
           WHERE assigned_contractor = :contractor_id AND UPPER(status) = 'COMPLETED'""",
        params
    )
    if err:
        return jsonify({'error': f'Flag rate query failed: {err}'}), 500

    # 1.5 Average Rating — live table: performance_ratings, column: overall_score
    # contractors.id == auth_user.id, and performance_ratings.user_id == auth_user.id
    avg_rating, err = _execute_query(
        """SELECT ROUND(AVG(pr.overall_score)::NUMERIC, 2) AS avg_rating
           FROM performance_ratings pr
           WHERE pr.user_id = :contractor_id""",
        params
    )
    if err:
        return jsonify({'error': f'Average rating query failed: {err}'}), 500

    # 1.6 Total Earnings — payments table (user_id FK to auth_user = contractors.id)
    total_earnings, err = _execute_query(
        """SELECT COALESCE(SUM(amount), 0) AS total_earnings
           FROM payments
           WHERE user_id = :contractor_id AND UPPER(payment_status) = 'PAID'""",
        params
    )
    if err:
        return jsonify({'error': f'Total earnings query failed: {err}'}), 500

    return jsonify({
        'total_jobs': total_jobs[0]['total_jobs'] if total_jobs else 0,
        'completed_jobs': completed_jobs[0]['completed_jobs'] if completed_jobs else 0,
        'completion_rate': float(completion_rate[0]['completion_rate'] or 0) if completion_rate else 0,
        'flag_rate': float(flag_rate[0]['flag_rate'] or 0) if flag_rate else 0,
        'avg_rating': float(avg_rating[0]['avg_rating'] or 0) if avg_rating else 0,
        'total_earnings': float(total_earnings[0]['total_earnings'] or 0) if total_earnings else 0,
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

    # Live DB columns on tickets:
    # designated_route (not route), start_location/end_location (text, not lat/lng)
    # No due_date, approved_at, rejected_at, service_type on tickets in live DB
    job_history_query = """
    SELECT
        t.id,
        t.description,
        t.designated_route          AS route,
        t.status,
        t.priority,
        t.anomaly_flag,
        t.anomaly_reason,
        t.start_time,
        t.end_time,
        t.start_location,
        t.end_location,
        t.contractor_notes,
        t.assigned_at,
        t.created_at,
        w.name                      AS work_order_name,
        w.description               AS work_order_description,
        pr.overall_score            AS performance_rating,
        pr.comments                 AS performance_comments
    FROM tickets t
    LEFT JOIN work_orders w ON t.work_order_id = w.id
    LEFT JOIN performance_ratings pr ON pr.user_id = t.assigned_contractor
    WHERE t.assigned_contractor = :contractor_id
    ORDER BY t.created_at DESC
    LIMIT :limit OFFSET :offset
    """
    jobs, err = _execute_query(job_history_query, params)
    if err:
        return jsonify({'error': f'Job history query failed: {err}'}), 500

    count_result, err = _execute_query(
        "SELECT COUNT(*) AS total_count FROM tickets WHERE assigned_contractor = :contractor_id",
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

    # Monthly job volume — tickets (plural)
    monthly_jobs, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', t.created_at) AS month,
               COUNT(*) AS job_count,
               COUNT(*) FILTER (WHERE UPPER(t.status) = 'COMPLETED') AS completed_count,
               COUNT(*) FILTER (WHERE UPPER(t.status) IN ('ASSIGNED', 'IN_PROGRESS')) AS active_count
           FROM tickets t
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
           FROM tickets t
           WHERE t.assigned_contractor = :contractor_id
             AND UPPER(t.status) = 'COMPLETED'
             AND t.end_time IS NOT NULL
           GROUP BY DATE_TRUNC('month', t.end_time)
           ORDER BY month DESC LIMIT 12""",
        params
    )
    if err:
        return jsonify({'error': f'Monthly completions query failed: {err}'}), 500

    # Rating trend — performance_ratings (live table name), overall_score (not rating)
    rating_trend, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', pr.rating_date) AS month,
               ROUND(AVG(pr.overall_score)::NUMERIC, 2)         AS avg_overall,
               ROUND(AVG(pr.reliability_score)::NUMERIC, 2)     AS avg_reliability,
               ROUND(AVG(pr.professionalism_score)::NUMERIC, 2) AS avg_professionalism,
               ROUND(AVG(pr.work_quality_score)::NUMERIC, 2)    AS avg_work_quality,
               COUNT(*) AS rating_count
           FROM performance_ratings pr
           WHERE pr.user_id = :contractor_id
           GROUP BY DATE_TRUNC('month', pr.rating_date)
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
           FROM tickets t
           WHERE t.assigned_contractor = :contractor_id
           GROUP BY DATE_TRUNC('month', t.created_at)
           ORDER BY month DESC LIMIT 12""",
        params
    )
    if err:
        return jsonify({'error': f'Anomaly trend query failed: {err}'}), 500

    # Monthly earnings via payments table
    monthly_earnings, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', p.payment_date) AS month,
               COALESCE(SUM(p.amount), 0)          AS total_paid,
               COUNT(*)                            AS payment_count
           FROM payments p
           WHERE p.user_id = :contractor_id
             AND UPPER(p.payment_status) = 'PAID'
           GROUP BY DATE_TRUNC('month', p.payment_date)
           ORDER BY month DESC LIMIT 12""",
        params
    )
    if err:
        return jsonify({'error': f'Monthly earnings query failed: {err}'}), 500

    return jsonify({
        'monthly_jobs': monthly_jobs,
        'monthly_completions': monthly_completions,
        'rating_trend': rating_trend,
        'anomaly_trend': anomaly_trend,
        'monthly_earnings': monthly_earnings,
    }), 200


@analytics_bp.route('/performance/distribution', methods=['GET'])
@token_required
def get_performance_distribution():
    """Get jobs by route and status for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    params = {'contractor_id': contractor_id}

    # designated_route is the route column in live DB
    by_route, err = _execute_query(
        """SELECT t.designated_route AS route, COUNT(*) AS job_count
           FROM tickets t
           WHERE t.assigned_contractor = :contractor_id AND t.designated_route IS NOT NULL
           GROUP BY t.designated_route ORDER BY job_count DESC""",
        params
    )
    if err:
        return jsonify({'error': f'Jobs by route query failed: {err}'}), 500

    by_status, err = _execute_query(
        """SELECT t.status, COUNT(*) AS job_count
           FROM tickets t
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

    # contractors.id is a FK to auth_user.id (same UUID).
    # first_name / last_name are on contractors, NOT on auth_user in live DB.
    # No license/certification/insurance/background_check tables in live DB.
    # license_number and expiration_date are scalar fields on contractors.
    profile_query = """
    SELECT
        au.id               AS auth_user_id,
        au.email,
        au.username,
        au.role,
        au.is_active,
        c.id                AS contractor_id,
        c.first_name,
        c.last_name,
        c.contact_number,
        c.contractor_type,
        c.status            AS contractor_status,
        c.license_number,
        c.expiration_date   AS license_expiration_date,
        c.tax_classification,
        c.address,
        c.vendor_id,
        c.created_at
    FROM contractors c
    JOIN auth_user au ON au.id = c.id
    WHERE c.id = :contractor_id
    """
    profile, err = _execute_query(profile_query, params)
    if err:
        return jsonify({'error': f'Profile query failed: {err}'}), 500
    if not profile:
        return jsonify({'error': 'Contractor not found'}), 404

    # Performance rating summary
    rating_summary, err = _execute_query(
        """SELECT
               ROUND(AVG(overall_score)::NUMERIC, 2)         AS avg_overall,
               ROUND(AVG(reliability_score)::NUMERIC, 2)     AS avg_reliability,
               ROUND(AVG(professionalism_score)::NUMERIC, 2) AS avg_professionalism,
               ROUND(AVG(work_quality_score)::NUMERIC, 2)    AS avg_work_quality,
               COUNT(*)                                       AS total_ratings
           FROM performance_ratings WHERE user_id = :contractor_id""",
        params
    )
    if err:
        return jsonify({'error': f'Rating summary query failed: {err}'}), 500

    # Recent individual ratings
    recent_ratings, err = _execute_query(
        """SELECT rating_id, rating_date, reliability_score, professionalism_score,
                  work_quality_score, overall_score, comments
           FROM performance_ratings WHERE user_id = :contractor_id
           ORDER BY rating_date DESC LIMIT 10""",
        params
    )
    if err:
        return jsonify({'error': f'Recent ratings query failed: {err}'}), 500

    return jsonify({
        'profile': profile[0],
        'rating_summary': rating_summary[0] if rating_summary else {},
        'recent_ratings': recent_ratings,
        # license/certification/insurance detail tables not in live DB
        # license_number and expiration_date are in profile above
    }), 200


# =================================================================
# PART 5: NOTIFICATIONS
# =================================================================

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

    # Live DB: notifications (plural), user_id direct FK to auth_user.id (= contractors.id)
    # Columns: id, user_id, title, message, type, is_read, created_at
    unread, err = _execute_query(
        "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = :contractor_id AND is_read = FALSE",
        params
    )
    if err:
        return jsonify({'error': f'Unread count query failed: {err}'}), 500

    recent, err = _execute_query(
        """SELECT id, title, message, type, is_read, created_at
           FROM notifications
           WHERE user_id = :contractor_id
           ORDER BY created_at DESC LIMIT 20""",
        params
    )
    if err:
        return jsonify({'error': f'Recent notifications query failed: {err}'}), 500

    return jsonify({
        'unread_count': unread[0]['unread_count'] if unread else 0,
        'notifications': recent,
    }), 200


@analytics_bp.route('/notifications/<notification_id>/read', methods=['PATCH'])
@token_required
def mark_notification_read(notification_id):
    """Mark a notification as read for the authenticated contractor."""
    contractor_id, err_resp = _validate_contractor_id(request.args.get('contractor_id'))
    if err_resp:
        return err_resp

    auth_contractor = _get_authenticated_contractor(request.user_id)
    ownership_error = _check_ownership(auth_contractor, contractor_id)
    if ownership_error:
        return ownership_error

    try:
        db.session.execute(
            text("UPDATE notifications SET is_read = TRUE WHERE id = :nid AND user_id = :contractor_id"),
            {'nid': notification_id, 'contractor_id': contractor_id}
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to mark notification as read: {e}'}), 500

    return jsonify({'success': True}), 200


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

    active_query = """
    SELECT
        t.id,
        t.description,
        t.designated_route      AS route,
        t.status,
        t.priority,
        t.start_time,
        t.end_time,
        t.start_location,
        t.end_location,
        t.anomaly_flag,
        t.contractor_notes,
        w.name                  AS work_order_name,
        w.description           AS work_order_description,
        w.location              AS work_order_location
    FROM tickets t
    LEFT JOIN work_orders w ON t.work_order_id = w.id
    WHERE t.assigned_contractor = :contractor_id
      AND UPPER(t.status) IN ('ASSIGNED', 'IN_PROGRESS', 'PENDING_APPROVAL')
    ORDER BY t.start_time DESC
    """
    active, err = _execute_query(active_query, params)
    if err:
        return jsonify({'error': f'Active work query failed: {err}'}), 500

    return jsonify({
        'active_tickets': active,
        'count': len(active) if active else 0,
    }), 200


# =================================================================
# PART 7: SHIFTS (live DB has this table)
# =================================================================

@analytics_bp.route('/shifts', methods=['GET'])
@token_required
def get_shifts():
    """Get shift history for the authenticated contractor."""
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

    shifts, err = _execute_query(
        """SELECT
               s.shift_id, s.shift_date, s.start_time, s.end_time,
               s.hours_worked, s.hourly_rate,
               ROUND((s.hours_worked * s.hourly_rate)::NUMERIC, 2) AS earnings,
               s.shift_status, s.notes
           FROM shifts s
           WHERE s.user_id = :contractor_id
           ORDER BY s.shift_date DESC
           LIMIT :limit OFFSET :offset""",
        params
    )
    if err:
        return jsonify({'error': f'Shifts query failed: {err}'}), 500

    monthly_summary, err = _execute_query(
        """SELECT
               DATE_TRUNC('month', s.shift_date) AS month,
               SUM(s.hours_worked)               AS total_hours,
               ROUND(SUM(s.hours_worked * s.hourly_rate)::NUMERIC, 2) AS total_earnings,
               COUNT(*) AS shift_count
           FROM shifts s
           WHERE s.user_id = :contractor_id
           GROUP BY DATE_TRUNC('month', s.shift_date)
           ORDER BY month DESC LIMIT 12""",
        {'contractor_id': contractor_id}
    )
    if err:
        return jsonify({'error': f'Shift summary query failed: {err}'}), 500

    return jsonify({
        'shifts': shifts,
        'monthly_summary': monthly_summary,
    }), 200
