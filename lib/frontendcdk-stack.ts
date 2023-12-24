import * as cdk from 'aws-cdk-lib'; // For core constructs
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"; // For creating cloudfront distribution
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins"; // For setting up cloudfront origin
import * as s3 from "aws-cdk-lib/aws-s3"; // For creating S3 bucket
import { Construct } from 'constructs'; // For defining resources in a stack
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment"; // To deploy objects to an S3 bucket
import * as path from "path"; // For working with files and directory paths

export class FrontendcdkStack extends cdk.Stack {
  private cfnOutCloudFrontUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a S3 bucket
    const bucket = new s3.Bucket(this, "myApp", {
      bucketName: 'myapp-staging-8c2f79',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Upload the contents of the web-build directory to the S3 bucket
    new s3Deploy.BucketDeployment(this, 'myAppDeployment', {
      sources: [
        s3Deploy.Source.asset(path.join(__dirname, '../web-build')),
      ],
      destinationBucket: bucket
    });

    // Create a CloudFront distribution and set it up to use the S3 bucket as its origin.    
    const distribution = new cloudfront.Distribution(this, "MyAppDistribution", {
      defaultBehavior: {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS, // Allow GET, HEAD and OPTIONS requests
        compress: true,
        origin: new cloudfrontOrigins.S3Origin(bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 400,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(10),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(10),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.seconds(10),
        },
      ],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2019,
    });

    // Output the Cloudfront URL
    this.cfnOutCloudFrontUrl = new cdk.CfnOutput(this, "CfnOutCloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "The CloudFront URL",
    });
  }
}