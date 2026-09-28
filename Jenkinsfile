properties([
    parameters([
        string(name: 'SOURCE_DB_IDENTIFIER', defaultValue: 'prod-rds-db', description: 'Source RDS Instance ID'),
        string(name: 'TARGET_ACCOUNT_ID', defaultValue: '123456789012', description: 'Target AWS Account ID'),
        string(name: 'TARGET_DB_IDENTIFIER', defaultValue: 'staging-rds-db', description: 'Target RDS Instance ID'),
        string(name: 'KMS_KEY_ID', defaultValue: 'arn:aws:kms:us-east-1:123456789012:key/your-key', description: 'KMS Key ARN for encryption')
    ])
])

node {
    def SNAPSHOT_ID = "rds-refresh-snapshot-${env.BUILD_ID}"
    
    try {
        stage('Authenticate & Validate') {
            withCredentials([aws(credentialsId: 'aws-prod-credentials', variable: 'AWS')]) {
                sh "aws sts get-caller-identity"
            }
        }

        stage('Take RDS Snapshot') {
            withCredentials([aws(credentialsId: 'aws-prod-credentials', variable: 'AWS')]) {
                echo "Taking snapshot of ${params.SOURCE_DB_IDENTIFIER}..."
                sh "aws rds create-db-snapshot --db-instance-identifier ${params.SOURCE_DB_IDENTIFIER} --db-snapshot-identifier ${SNAPSHOT_ID}"
                echo "Waiting for snapshot to become available..."
                sh "aws rds wait db-snapshot-available --db-snapshot-identifier ${SNAPSHOT_ID}"
            }
        }

        stage('Share Snapshot & KMS Key') {
            withCredentials([aws(credentialsId: 'aws-prod-credentials', variable: 'AWS')]) {
                echo "Sharing snapshot with target account ${params.TARGET_ACCOUNT_ID}..."
                sh """
                aws rds modify-db-snapshot-attribute \
                    --db-snapshot-identifier ${SNAPSHOT_ID} \
                    --attribute-name restore \
                    --values-to-add ${params.TARGET_ACCOUNT_ID}
                """
            }
        }

        stage('Restore RDS in Target Account') {
            withCredentials([aws(credentialsId: 'aws-target-credentials', variable: 'AWS')]) {
                echo "Restoring RDS instance in target environment..."
                // حذف البيئة القديمة إن وجدت لضمان الـ Idempotency، ثم الاستعادة
                sh "aws rds delete-db-instance --db-instance-identifier ${params.TARGET_DB_IDENTIFIER} --skip-final-snapshot || true"
                
                sh """
                aws rds restore-db-instance-from-db-snapshot \
                    --db-instance-identifier ${params.TARGET_DB_IDENTIFIER} \
                    --db-snapshot-identifier arn:aws:rds:us-east-1:PROD_ACCOUNT_ID:snapshot:${SNAPSHOT_ID}
                """
                echo "Waiting for RDS instance to be available..."
                sh "aws rds wait db-instance-available --db-instance-identifier ${params.TARGET_DB_IDENTIFIER}"
            }
        }

        stage('Post-Restore Configuration') {
            withCredentials([
                aws(credentialsId: 'aws-target-credentials', variable: 'AWS'),
                usernamePassword(credentialsId: 'db-admin-credentials', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASS')
            ]) {
                echo "Applying post-restore configurations and recreating lower-env users..."
                // فصل منطق الاستعادة عن إعدادات ما بعد الاستعادة بتشغيل سكريبت التهيئة
                sh "python3 apply_post_restore_config.py --db-identifier ${params.TARGET_DB_IDENTIFIER}"
            }
        }

        stage('Cleanup') {
            withCredentials([aws(credentialsId: 'aws-prod-credentials', variable: 'AWS')]) {
                echo "Cleaning up temporary snapshot..."
                sh "aws rds delete-db-snapshot --db-snapshot-identifier ${SNAPSHOT_ID} || true"
            }
            currentBuild.result = 'SUCCESS'
        }

    } catch (Exception e) {
        currentBuild.result = 'FAILURE'
        echo "Pipeline failed: ${e.getMessage()}"
        error("Pipeline aborted due to failure in RDS Refresh process.")
    }
}