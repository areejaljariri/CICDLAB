# CI/CD Lab - Node.js Deployment Pipeline

## Overview
This repository contains a simple Node.js application configured with automated testing, CI/CD pipeline via GitHub Actions, and container image publishing to Docker Hub.

## Project Structure
- `app.js`: Main Node.js server with `/health` check endpoint.
- `test.js`: Integration test for health check endpoint.
- `.github/workflows/ci.yml`: CI/CD workflow running automated tests and publishing Docker images.
- `Dockerfile`: Container configuration for Node.js 20.

---

## Part D: Understanding Deployment Strategies

### Q1: Your application is a REST API with 3 running replicas in Kubernetes. You want to deploy a new version with zero downtime. Which strategy would you use and why?
**Answer:**
**Rolling Update Strategy.**
- **Why:** Kubernetes replaces old replicas with new ones incrementally. By setting `maxUnavailable` and `maxSurge` controls, a set of healthy replicas always remains online to serve incoming traffic, guaranteeing zero downtime.

---

### Q2: Your team just discovered a critical bug in the version deployed 10 minutes ago. You used a rolling update. What is the fastest way to recover?
**Answer:**
**Automated Rollback via `kubectl rollout undo`.**
- **Why:** This command instantly reverts the deployment to the previous revision using pre-existing, cached container images, providing an immediate fix without waiting for a new CI/CD build pipeline execution.

---

### Q3: You are deploying a major new feature that you want only 5% of users to see first. Which strategy applies?
**Answer:**
**Canary Deployment Strategy.**
- **Why:** Traffic management tools route a small subset of user traffic (5%) to the new version while keeping 95% on the stable version. This allows real-world validation of new features under production conditions before a full rollout.

---

### Q4: You are deploying a database schema migration that is not backwards compatible with the old application version. Why can a rolling update be dangerous here? What strategy would you use instead?
**Answer:**
- **Why Rolling Update is dangerous:** Old and new app versions briefly run side-by-side during a rolling update. A non-backwards-compatible database change breaks active old replicas that still rely on the old schema.
- **Alternative Strategies:**
  1. **Recreate Strategy:** Stop all v1 pods, execute the database migration, then deploy v2.
  2. **Blue-Green Deployment:** Deploy v2 with the updated database in an isolated environment, verify functionality, and switch production traffic all at once.
  3. **Expand-Contract Pattern:** Break schema updates into backward-compatible steps across multiple controlled deployments.