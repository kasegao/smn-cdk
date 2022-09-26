import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import { Construct } from 'constructs';

interface SmnCdkStackProps extends cdk.StackProps {
  readonly proj: string;
}

export class SmnCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SmnCdkStackProps) {
    super(scope, id, props);

    const projName = `${props.proj}-${Math.random().toString(36).slice(-8)}`;

    const s3Bucket = new s3.Bucket(this, "bucket", {
      bucketName: projName,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const smPolicy = new iam.Policy(this, "policy", {
      policyName: `sagemaker-policy-${projName}`,
      statements: [ 
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:ListBucket",
          ],
          resources: [
            s3Bucket.bucketArn,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
          ],
          resources: [
            `${s3Bucket.bucketArn}/*`,
          ],
        }),
      ],
    });
    const smRole = new iam.Role(this, "role", {
      roleName: `sagemaker-role-${projName}`,
      assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSageMakerFullAccess"),
      ],
    });
    smRole.attachInlinePolicy(smPolicy);

    const notebook = new sagemaker.CfnNotebookInstance(this, "notebook", {
      notebookInstanceName: projName,
      instanceType: "ml.t3.medium",
      roleArn: smRole.roleArn,
      volumeSizeInGb: 5,
      platformIdentifier: "notebook-al2-v1",
      directInternetAccess: "Enabled",
      // @see: `https://github.com/kasegao/sagemaker-sample/blob/main/lifecycle/auto-stop-idle.sh`
      lifecycleConfigName: "auto-stop-idle",
    });
  }
}
