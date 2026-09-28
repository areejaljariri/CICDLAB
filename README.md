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
# RDS Database Refresh Pipeline (Jenkinsfile)

This Jenkins pipeline automates the periodic refresh of lower environments (staging/dev) using sanitized and reconfigured production-like RDS database snapshots across AWS accounts.

## Architecture / Flow Diagram
[Source RDS] ---> [Create Snapshot] ---> [Share with Target Account via KMS] ---> [Restore RDS in Target Account] ---> [Post-Restore Config & User Permissions] ---> [Cleanup]

## Assumptions
- Cross-account IAM roles and KMS key policies are pre-configured to allow snapshot sharing.
- Jenkins server has AWS CLI installed and configured with appropriate network access.

## Prerequisites & Credentials Store
Configure the following credentials inside **Jenkins Credentials Store**:
1. `aws-prod-credentials`: AWS IAM credentials for the source production account.
2. `aws-target-credentials`: AWS IAM credentials for the target lower environment account.
3. `db-admin-credentials`: Database administrator username and password for running post-restore scripts.

## How It Works & Idempotency
1. **Snapshot Creation:** Takes a point-in-time snapshot of the source production RDS instance.
2. **Sharing:** Modifies snapshot attributes to share access securely with the target AWS account ID.
3. **Restoration:** Safely deletes any existing target instance (ensuring idempotency) and restores a fresh instance from the shared snapshot.
4. **Post-Restore Configuration:** Separates infrastructure restore logic from database logic by executing post-restore scripts to recreate lower-env users and reapply environment-specific permissions.
5. **Cleanup:** Deletes temporary snapshot resources and handles failure notifications gracefully using a `try-catch` error handling block.