from flask import request, jsonify
from app.models import DutySessions, DutyLogs, db
from .schemas import duty_session_schema, duty_logs_schema, status_change_schema
from marshmallow import ValidationError
from . import drive_time_bp
from app.util.auth import token_required
from datetime import datetime, timezone, date, timedelta


VALID_STATUSES = {'driving', 'on_duty', 'off_duty', 'sleeper_berth'}

# FMCSA limits (in seconds)
DAILY_DRIVE_LIMIT = 11 * 3600       # 11 hours driving per day
DAILY_ON_DUTY_LIMIT = 14 * 3600     # 14-hour on-duty window
CYCLE_LIMIT = 70 * 3600             # 70-hour / 8-day cycle


def _total_driving_seconds(session):
    """Sum all driving seconds for a session, including the active segment."""
    total = 0
    now = datetime.now(timezone.utc)
    for log in session.logs:
        if log.status == 'driving':
            if log.duration_seconds is not None:
                total += log.duration_seconds
            elif log.end_time is None:
                # Currently driving — count elapsed time
                # SQLite returns naive datetimes, so attach UTC if missing
                start = log.start_time if log.start_time.tzinfo else log.start_time.replace(tzinfo=timezone.utc)
                total += int((now - start).total_seconds())
    return total


def _get_or_create_session(contractor_id):
    """Return today's active session, or create a new one."""
    today = date.today()
    session = db.session.query(DutySessions).filter_by(
        contractor_id=contractor_id,
        session_date=today,
        is_active=True,
    ).first()

    if not session:
        session = DutySessions(
            contractor_id=contractor_id,
            session_date=today,
            current_status='off_duty',
        )
        db.session.add(session)
        db.session.flush()

    return session


# ── GET /drive-time/current — current session + logs ────────────────────────
@drive_time_bp.route('/current', methods=['GET'])
@token_required
def get_current_session():
    contractor_id = request.user_id
    today = date.today()

    session = db.session.query(DutySessions).filter_by(
        contractor_id=contractor_id,
        session_date=today,
        is_active=True,
    ).first()

    if not session:
        return jsonify({
            'session': None,
            'driving_seconds': 0,
            'remaining_seconds': DAILY_DRIVE_LIMIT,
            'cycle_seconds': 0,
        }), 200

    driving_secs = _total_driving_seconds(session)

    # 70-hour cycle: sum driving across last 8 days
    eight_days_ago = today - timedelta(days=7)
    cycle_sessions = db.session.query(DutySessions).filter(
        DutySessions.contractor_id == contractor_id,
        DutySessions.session_date >= eight_days_ago,
    ).all()
    cycle_secs = sum(_total_driving_seconds(s) for s in cycle_sessions)

    return jsonify({
        'session': duty_session_schema.dump(session),
        'driving_seconds': driving_secs,
        'remaining_seconds': max(0, DAILY_DRIVE_LIMIT - driving_secs),
        'cycle_seconds': cycle_secs,
    }), 200


# ── POST /drive-time/status — change duty status ───────────────────────────
@drive_time_bp.route('/status', methods=['POST'])
@token_required
def change_status():
    try:
        data = status_change_schema.load(request.json)
    except ValidationError as e:
        return jsonify(e.messages), 400

    new_status = data['status']
    if new_status not in VALID_STATUSES:
        return jsonify({
            'error': f'Invalid status. Must be one of: {", ".join(sorted(VALID_STATUSES))}',
        }), 400

    contractor_id = request.user_id
    now = datetime.now(timezone.utc)
    session = _get_or_create_session(contractor_id)

    if session.current_status == new_status:
        return jsonify({'error': f'Already in {new_status} status.'}), 400

    # Close the current active log (if any)
    active_log = db.session.query(DutyLogs).filter_by(
        session_id=session.id,
        contractor_id=contractor_id,
        end_time=None,
    ).first()

    if active_log:
        active_log.end_time = now
        active_log.duration_seconds = int((now - active_log.start_time).total_seconds())

    # Create a new log for the new status
    new_log = DutyLogs(
        session_id=session.id,
        contractor_id=contractor_id,
        status=new_status,
        start_time=now,
    )
    db.session.add(new_log)

    session.current_status = new_status
    db.session.commit()

    driving_secs = _total_driving_seconds(session)

    return jsonify({
        'message': f'Status changed to {new_status}.',
        'session': duty_session_schema.dump(session),
        'driving_seconds': driving_secs,
        'remaining_seconds': max(0, DAILY_DRIVE_LIMIT - driving_secs),
    }), 200


# ── POST /drive-time/stop — end the session for the day ─────────────────────
@drive_time_bp.route('/stop', methods=['POST'])
@token_required
def stop_session():
    contractor_id = request.user_id
    today = date.today()
    now = datetime.now(timezone.utc)

    session = db.session.query(DutySessions).filter_by(
        contractor_id=contractor_id,
        session_date=today,
        is_active=True,
    ).first()

    if not session:
        return jsonify({'error': 'No active session to stop.'}), 404

    # Close any open log
    active_log = db.session.query(DutyLogs).filter_by(
        session_id=session.id,
        contractor_id=contractor_id,
        end_time=None,
    ).first()

    if active_log:
        active_log.end_time = now
        active_log.duration_seconds = int((now - active_log.start_time).total_seconds())

    session.is_active = False
    session.ended_at = now
    session.current_status = 'off_duty'
    db.session.commit()

    return jsonify({
        'message': 'Session ended.',
        'session': duty_session_schema.dump(session),
    }), 200


# ── GET /drive-time/logs — driving log history for today ────────────────────
@drive_time_bp.route('/logs', methods=['GET'])
@token_required
def get_logs():
    contractor_id = request.user_id
    today = date.today()

    session = db.session.query(DutySessions).filter_by(
        contractor_id=contractor_id,
        session_date=today,
    ).first()

    if not session:
        return jsonify({'logs': []}), 200

    return jsonify({
        'logs': duty_logs_schema.dump(session.logs),
    }), 200
