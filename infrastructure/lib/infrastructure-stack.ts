import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export class InfrastructureStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Document S3 Bucket
        const documentBucket = new s3.Bucket(this, 'DocumentBucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
                    allowedOrigins: ['*'], // Update for production
                    allowedHeaders: ['*'],
                },
            ],
        });

        // Domain Events SQS Queue
        const domainEventsQueue = new sqs.Queue(this, 'DomainEventsQueue', {
            visibilityTimeout: cdk.Duration.seconds(300),
        });

        // VPC and ECS Cluster setup
        const vpc = new ec2.Vpc(this, 'FullstackVpc', {
            maxAzs: 2,
        });

        const cluster = new ecs.Cluster(this, 'FullstackCluster', {
            vpc,
        });

        // Output resources for usage in apps
        new cdk.CfnOutput(this, 'BucketName', {
            value: documentBucket.bucketName,
        });

        new cdk.CfnOutput(this, 'QueueUrl', {
            value: domainEventsQueue.queueUrl,
        });
    }
}
