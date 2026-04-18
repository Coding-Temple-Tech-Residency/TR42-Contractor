import json
import logging
import os

import anthropic
from flask import jsonify, request
from marshmallow import ValidationError

log = logging.getLogger(__name__)

from app.util.auth import token_required
from . import ai_bp
from .schemas import inspection_assist_schema

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
    return _client

# Cached system prompt — stable across all requests so caching kicks in immediately
_SYSTEM_PROMPT = """You are an AI assistant for field contractors.
Convert raw contractor field notes into a structured inspection report.
Respond with ONLY valid JSON using exactly these fields:
- title: short descriptive title (string)
- priority: one of "low", "medium", or "high" (string)
- category: e.g. "Electrical", "Plumbing", "HVAC", "Structural", "Safety" (string)
- description: clear professional description of the issue (string)
- recommended_actions: specific action items to address the issue (array of strings)

Do not include any text outside the JSON object."""


@ai_bp.route('/inspection-assist', methods=['POST'])
@token_required
def inspection_assist():
    try:
        data = inspection_assist_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify(e.messages), 400

    notes = data['notes'].strip()
    if not notes:
        return jsonify({'error': 'notes cannot be empty'}), 400

    try:
        response = _get_client().messages.create(
            model='claude-haiku-4-5',
            max_tokens=1024,
            system=[{
                'type': 'text',
                'text': _SYSTEM_PROMPT,
                'cache_control': {'type': 'ephemeral'},
            }],
            messages=[{
                'role': 'user',
                'content': f'Convert these field notes into a structured report:\n\n{notes}',
            }],
        )
        text = next(b.text for b in response.content if b.type == 'text')
        report = json.loads(text)
        return jsonify(report), 200
    except json.JSONDecodeError:
        return jsonify({'error': 'AI returned an unexpected format'}), 500
    except anthropic.APIError as e:
        return jsonify({'error': f'AI service error: {str(e)}'}), 503
    except Exception as e:
        log.exception('Unexpected error in inspection-assist')
        return jsonify({'error': f'Server error: {str(e)}'}), 500
