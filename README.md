# App Deployment Pipeline via GitHub Actions

This repository contains a Node.js application packaged with Docker and automated via GitHub Actions to deploy seamlessly onto a Kubernetes cluster.

## Architecture / Flow Diagram
[Code Commit (main)] ---> [GitHub Actions CI/CD] ---> [Build Docker Image] ---> [Push to AWS ECR] ---> [Update K8s Manifest] ---> [Deploy to Kubernetes Cluster & Verify Rollout]

## Assumptions
- The application uses `main` as the production release branch.
- Target Kubernetes cluster is accessible via a provided `Kubeconfig` secret.
- AWS Elastic Container Registry (ECR) is pre-configured to host the container images.

## Prerequisites & Secrets Configuration
To make this pipeline run successfully, add the following secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):
1. `AWS_ACCESS_KEY_ID`: AWS Access Key with ECR permissions.
2. `AWS_SECRET_ACCESS_KEY`: AWS Secret Key.
3. `KUBE_CONFIG_BASE64`: Base64-encoded Kubernetes configuration file (`~/.kube/config`).

## How It Works
1. **Trigger:** Any push to the `main` branch triggers the GitHub Actions workflow.
2. **Build & Push:** The workflow builds the Docker image using the root `Dockerfile`, tags it with the unique Git Commit SHA (`github.sha`), and pushes it to AWS ECR.
3. **Deploy:** It configures `kubectl`, updates the image tag dynamically in the Kubernetes manifest file, and applies the deployment to the `production` namespace.
4. **Rollout Check & Rollback:** It monitors the rollout status. If any failure or timeout occurs, it automatically triggers `kubectl rollout undo` to rollback safely.