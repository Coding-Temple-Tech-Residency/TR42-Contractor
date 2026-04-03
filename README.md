# TR Project Template

## Project Information

**Project Name:**  Contractor Mobile 
**Team Name:**  
**Team Members:**  
- Nicole Cespedes- Backend
- Edward Cochran- Backend
- Jonathan Hubbard - Full Stack (Frontend focus)
- Troy Wenzel - Frontend
- Johnna Auman - Cybersecurity
- Charlie Estrada - Frontend
- James Bustamante - Backend
- Aldo Pena Herrera - Fullstack (Backend focus)


**Tech Stack:** 
Python Flask, SQL ALCHEMY 
REACT NATIVE EXPO

## Project Overview

Provide a short description of your project:

- What problem does it solve?  
- Who is the target user?  
- What core features were completed?  

## Setup & Documentation

Include any necessary documentation below:

- Setup instructions  
- Required environment variables
- 
- API documentation (if applicable)  
- Test credentials (if applicable)  
- Deployment link (if available)  


## Authentication

The backend uses JWT-based authentication for protected API routes.

### Token Expiry

JWT access tokens expire **14 hours** after they are issued.

The token payload includes:

- `iat`: token issued time
- `exp`: token expiration time
- `sub`: authenticated user ID
- `role`: authenticated user role

Current configuration:

```python
'exp': datetime.now(timezone.utc) + timedelta(hours=14)

## Notes

List any known limitations, incomplete features, or important technical considerations.

## Development Standards Reminder

All submissions should reflect professional engineering standards:

- Write clean, readable, and modular code  
- Use clear naming conventions  
- Remove unused files, variables, and console logs  
- Follow consistent formatting and linting practices  
- Write meaningful commit messages  
- Keep branches organized and avoid pushing broken code to main  
- Review teammate pull requests respectfully and constructively  

Your repository should be organized, understandable, and demo-ready.

## Intellectual Property Notice

This project was created as part of a Coding Temple Tech Residency. All work produced during the residency is considered the intellectual property of Coding Temple or the sponsoring employer, unless otherwise stated in a signed agreement. By contributing to this project, you acknowledge and agree to these terms.
