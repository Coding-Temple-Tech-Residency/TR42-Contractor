from flask import request, jsonify
from app.models import db
from sqlalchemy import text
from . import analytics_bp
from app.util.auth import token_required

def _execute_query(query, params=None):
    """Execute raw SQL and return results as list of dicts."""
    try:
        result = db.session.execute(text(query), params or {})
        columns = result.keys()
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
    """Get dashboard stats cards for a contractor."""
    contractor_id = request.args.get('contractor_id')
    if not contractor_id:
        return jsonify({'error': 'contractor_id is required'}), 400

    params = {'contractor_id': int(contractor_id)}

    # 1.1 Total Jobs
    total_jobs_query = """
    SELECT COUNT(*) AS total_jobs
    FROM tickets
    WHERE contractorid = :contractor_id
    """
    total_jobs, err = _execute_query(total_jobs_query, params)
    if err:
        return jsonify({'error': f'Total jobs query failed: {err}'}), 500

    # 1.2 Completed Jobs
    completed_jobs_query = """
    SELECT COUNT(*) AS completed_jobs
    FROM tickets
    WHERE contractorid = :contractor_id
    AND status = 'completed'
    """
    completed_jobs, err = _execute_query(completed_jobs_query, params)
    if err:
        return jsonify({'error': f'Completed jobs query failed: {err}'}), 500

    # 1.3 Completion Rate
    completion_rate_query = """
    SELECT ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 2
    ) AS completion_rate
    FROM tickets
    WHERE contractorid = :contractor_id
    """
    completion_rate, err = _execute_query(completion_rate_query, params)
    if err:
        return jsonify({'error': f'Completion rate query failed: {err}'}), 500

    # 1.4 Flag Rate
    flag_rate_query = """
    SELECT ROUND(
        COUNT(*) FILTER (WHERE geofenceverified = FALSE OR biometricverified = FALSE)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 2
    ) AS flag_rate
    FROM tickets
    WHERE contractorid = :contractor_id
    """
    flag_rate, err = _execute_query(flag_rate_query, params)
    if err:
        return jsonify({'error': f'Flag rate query failed: {err}'}), 500

    # 1.5 Average Rating
    avg_rating_query = """
    SELECT ROUND(AVG(rating), 2) AS avg_rating
    FROM contractorperformance
    WHERE contractorid = :contractor_id
    """
    avg_rating, err = _execute_query(avg_rating_query, params)
    if err:
        return jsonify({'error': f'Average rating query failed: {err}'}), 500

    # 1.6 Total Earnings
    total_earnings_query = """
    SELECT COALESCE(SUM(freightamount), 0) AS total_earnings
    FROM tickets
    WHERE contractorid = :contractor_id
    AND status = 'completed'
    AND paymentstatus = 'paid'
    """
    total_earnings, err = _execute_query(total_earnings_query, params)
    if err:
        return jsonify({'error': f'Total earnings query failed: {err}'}), 500

    return jsonify({
        'total_jobs': total_jobs[0]['total_jobs'] if total_jobs else 0,
        'completed_jobs': completed_jobs[0]['completed_jobs'] if completed_jobs else 0,
        'completion_rate': float(completion_rate[0]['completion_rate'] or 0) if completion_rate else 0,
        'flag_rate': float(flag_rate[0]['flag_rate'] or 0) if flag_rate else 0,
        'avg_rating': float(avg_rating[0]['avg_rating'] or 0) if avg_rating else 0,
        'total_earnings': float(total_earnings[0]['total_earnings'] or 0) if total_earnings else 0
    }), 200

# =================================================================
# PART 2: JOB HISTORY TABLE
# =================================================================

@analytics_bp.route('/jobs', methods=['GET'])
@token_required
def get_job_history():
    """Get paginated job history for a contractor."""
    contractor_id = request.args.get('contractor_id')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    offset = (page - 1) * limit

    if not contractor_id:
        return jsonify({'error': 'contractor_id is required'}), 400

    params = {'contractor_id': int(contractor_id), 'limit': limit, 'offset': offset}

    # Job History with pagination
    job_history_query = """
    SELECT t.id, t.ticketnumber, t.status, t.freightamount,
           t.createdat, t.deliverydatetime, t.route,
           t.geofenceverified, t.biometricverified,
           t.anomalyflag, t.rating
    FROM tickets t
    WHERE t.contractorid = :contractor_id
    ORDER BY t.createdat DESC
    LIMIT :limit OFFSET :offset
    """
    jobs, err = _execute_query(job_history_query, params)
    if err:
        return jsonify({'error': f'Job history query failed: {err}'}), 500

    # Total count for pagination
    count_query = """
    SELECT COUNT(*) AS total_count
    FROM tickets
    WHERE contractorid = :contractor_id
    """
    count_result, err = _execute_query(count_query, {'contractor_id': int(contractor_id)})
    if err:
        return jsonify({'error': f'Count query failed: {err}'}), 500

    total = count_result[0]['total_count'] if count_result else 0

    return jsonify({
        'jobs': jobs,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': total,
            'total_pages': (total + limit - 1) // limit
        }
    }), 200

# =================================================================
# PART 3: PERFORMANCE CHARTS
# =================================================================

@analytics_bp.route('/performance/trends', methods=['GET'])
@token_required
def get_performance_trends():
    """Get monthly performance trends (jobs, earnings, ratings)."""
    contractor_id = request.args.get('contractor_id')
    if not contractor_id:
        return jsonify({'error': 'contractor_id is required'}), 400

    params = {'contractor_id': int(contractor_id)}

    # Monthly Job Trend
    monthly_jobs_query = """
    SELECT DATE_TRUNC('month', t.createdat) AS month,
           COUNT(*) AS job_count
    FROM tickets t
    WHERE t.contractorid = :contractor_id
    GROUP BY DATE_TRUNC('month', t.createdat)
    ORDER BY month
    """
    monthly_jobs, err = _execute_query(monthly_jobs_query, params)
    if err:
        return jsonify({'error': f'Monthly jobs query failed: {err}'}), 500

    # Monthly Earnings Trend
    monthly_earnings_query = """
    SELECT DATE_TRUNC('month', t.deliverydatetime) AS month,
           COALESCE(SUM(t.freightamount), 0) AS monthly_earnings
    FROM tickets t
    WHERE t.contractorid = :contractor_id
    AND t.status = 'completed'
    GROUP BY DATE_TRUNC('month', t.deliverydatetime)
    ORDER BY month
    """
    monthly_earnings, err = _execute_query(monthly_earnings_query, params)
    if err:
        return jsonify({'error': f'Monthly earnings query failed: {err}'}), 500

    # Rating Trend
    rating_trend_query = """
    SELECT DATE_TRUNC('month', cp.createdat) AS month,
           ROUND(AVG(cp.rating), 2) AS avg_rating
    FROM contractorperformance cp
    WHERE cp.contractorid = :contractor_id
    GROUP BY DATE_TRUNC('month', cp.createdat)
    ORDER BY month
    """
    rating_trend, err = _execute_query(rating_trend_query, params)
    if err:
        return jsonify({'error': f'Rating trend query failed: {err}'}), 500

    return jsonify({
        'monthly_jobs': monthly_jobs,
        'monthly_earnings': monthly_earnings,
        'rating_trend': rating_trend
    }), 200

@analytics_bp.route('/performance/distribution', methods=['GET'])
@token_required
def get_performance_distribution():
    """Get jobs by route type and status for charts."""
    contractor_id = request.args.get('contractor_id')
    if not contractor_id:
        return jsonify({'error': 'contractor_id is required'}), 400

    params = {'contractor_id': int(contractor_id)}

    # Jobs by Route Type
    by_route_query = """
    SELECT t.route, COUNT(*) AS job_count
    FROM tickets t
    WHERE t.contractorid = :contractor_id
    GROUP BY t.route
    ORDER BY job_count DESC
    """
    by_route, err = _execute_query(by_route_query, params)
    if err:
        return jsonify({'error': f'Jobs by route query failed: {err}'}), 500

    # Jobs by Status
    by_status_query = """
    SELECT t.status, COUNT(*) AS job_count
    FROM tickets t
    WHERE t.contractorid = :contractor_id
    GROUP BY t.status
    ORDER BY job_count DESC
    """
    by_status, err = _execute_query(by_status_query, params)
    if err:
        return jsonify({'error': f'Jobs by status query failed: {err}'}), 500

    return jsonify({
        'by_route': by_route,
        'by_status': by_status
    }), 200

# =================================================================
# PART 4: CONTRACTOR PROFILE DATA
# =================================================================

@analytics_bp.route('/profile', methods=['GET'])
@token_required
def get_contractor_profile():
    """Get contractor profile details and certifications."""
    contractor_id = request.args.get('contractor_id')
    if not contractor_id:
        return jsonify({'error': 'contractor_id is required'}), 400

    params = {'contractor_id': int(contractor_id)}

    # Contractor Profile
    profile_query = """
    SELECT u.id AS user_id, u.firstname, u.lastname, u.email, u.username,
           u.profile_photo, u.is_active,
           c.licensenumber, c.insurancenumber, c.companyname,
           c.phone, c.address
    FROM auth_users u
    JOIN contractors c ON c.id = u.id
    WHERE u.id = :contractor_id
    """
    profile, err = _execute_query(profile_query, params)
    if err:
        return jsonify({'error': f'Profile query failed: {err}'}), 500

    if not profile:
        return jsonify({'error': 'Contractor not found'}), 404

    # Certifications Status
    certs_query = """
    SELECT 'License' AS document_type, c.licensenumber AS document_number,
           c.licenseexpiry AS expiry_date, c.licensestatus AS status
    FROM contractors c WHERE c.id = :contractor_id
    UNION ALL
    SELECT 'Insurance' AS document_type, c.insurancenumber,
           c.insuranceexpiry, c.insurancestatus
    FROM contractors c WHERE c.id = :contractor_id
    """
    certifications, err = _execute_query(certs_query, params)
    if err:
        return jsonify({'error': f'Certifications query failed: {err}'}), 500

    return jsonify({
        'profile': profile[0] if profile else None,
        'certifications': certifications
    }), 200

# =================================================================
# PART 5: NOTIFICATIONS
# =================================================================

@analytics_bp.route('/notifications', methods=['GET'])
@token_required
def get_notifications():
    """Get notifications for a contractor."""
    contractor_id = request.args.get('contractor_id')
    if not contractor_id:
        return jsonify({'error': 'contractor_id is required'}), 400

    params = {'contractor_id': int(contractor_id)}

    # Unread Notification Count
    unread_query = """
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE contractorid = :contractor_id
    AND isread = FALSE
    """
    unread, err = _execute_query(unread_query, params)
    if err:
        return jsonify({'error': f'Unread count query failed: {err}'}), 500

    # Recent Notifications
    recent_query = """
    SELECT id, title, message, isread, createdat
    FROM notifications
    WHERE contractorid = :contractor_id
    ORDER BY createdat DESC
    LIMIT 10
    """
    recent, err = _execute_query(recent_query, params)
    if err:
        return jsonify({'error': f'Recent notifications query failed: {err}'}), 500

    return jsonify({
        'unread_count': unread[0]['unread_count'] if unread else 0,
        'recent_notifications': recent
    }), 200

# =================================================================
# PART 6: ACTIVE WORK
# =================================================================

@analytics_bp.route('/active-work', methods=['GET'])
@token_required
def get_active_work():
    """Get currently active/in-progress tickets for a contractor."""
    contractor_id = request.args.get('contractor_id')
    if not contractor_id:
        return jsonify({'error': 'contractor_id is required'}), 400

    params = {'contractor_id': int(contractor_id)}

    active_query = """
    SELECT t.id, t.ticketnumber, t.status, t.freightamount,
           t.createdat, t.deliverydatetime, t.route,
           t.startlocation, t.endlocation,
           t.geofenceverified, t.biometricverified
    FROM tickets t
    WHERE t.contractorid = :contractor_id
    AND t.status IN ('accepted', 'in_transit', 'arrived')
    ORDER BY t.createdat DESC
    """
    active, err = _execute_query(active_query, params)
    if err:
        return jsonify({'error': f'Active work query failed: {err}'}), 500

    return jsonify({
        'active_tickets': active,
        'count': len(active) if active else 0
    }), 200
