"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const sqs = require("aws-cdk-lib/aws-sqs");
const ec2 = require("aws-cdk-lib/aws-ec2");
const ecs = require("aws-cdk-lib/aws-ecs");
class InfrastructureStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.InfrastructureStack = InfrastructureStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmFzdHJ1Y3R1cmUtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYXN0cnVjdHVyZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMseUNBQXlDO0FBQ3pDLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBRTNDLE1BQWEsbUJBQW9CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDOUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixxQkFBcUI7UUFDckIsTUFBTSxjQUFjLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN6RCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsSUFBSSxFQUFFO2dCQUNGO29CQUNJLGNBQWMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDO29CQUM3RSxjQUFjLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSx3QkFBd0I7b0JBQy9DLGNBQWMsRUFBRSxDQUFDLEdBQUcsQ0FBQztpQkFDeEI7YUFDSjtTQUNKLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDL0QsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1NBQy9DLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUMxQyxNQUFNLEVBQUUsQ0FBQztTQUNaLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDdEQsR0FBRztTQUNOLENBQUMsQ0FBQztRQUVILHFDQUFxQztRQUNyQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNsQyxLQUFLLEVBQUUsY0FBYyxDQUFDLFVBQVU7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDaEMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLFFBQVE7U0FDcEMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBeENELGtEQXdDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xyXG5pbXBvcnQgKiBhcyBzcXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNxcyc7XHJcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcclxuaW1wb3J0ICogYXMgZWNzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3MnO1xyXG5cclxuZXhwb3J0IGNsYXNzIEluZnJhc3RydWN0dXJlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgICAgICAvLyBEb2N1bWVudCBTMyBCdWNrZXRcclxuICAgICAgICBjb25zdCBkb2N1bWVudEJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0RvY3VtZW50QnVja2V0Jywge1xyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgICAgICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcclxuICAgICAgICAgICAgY29yczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGFsbG93ZWRNZXRob2RzOiBbczMuSHR0cE1ldGhvZHMuR0VULCBzMy5IdHRwTWV0aG9kcy5QT1NULCBzMy5IdHRwTWV0aG9kcy5QVVRdLFxyXG4gICAgICAgICAgICAgICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSwgLy8gVXBkYXRlIGZvciBwcm9kdWN0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gRG9tYWluIEV2ZW50cyBTUVMgUXVldWVcclxuICAgICAgICBjb25zdCBkb21haW5FdmVudHNRdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ0RvbWFpbkV2ZW50c1F1ZXVlJywge1xyXG4gICAgICAgICAgICB2aXNpYmlsaXR5VGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzAwKSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gVlBDIGFuZCBFQ1MgQ2x1c3RlciBzZXR1cFxyXG4gICAgICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdGdWxsc3RhY2tWcGMnLCB7XHJcbiAgICAgICAgICAgIG1heEF6czogMixcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IG5ldyBlY3MuQ2x1c3Rlcih0aGlzLCAnRnVsbHN0YWNrQ2x1c3RlcicsIHtcclxuICAgICAgICAgICAgdnBjLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBPdXRwdXQgcmVzb3VyY2VzIGZvciB1c2FnZSBpbiBhcHBzXHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0J1Y2tldE5hbWUnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBkb2N1bWVudEJ1Y2tldC5idWNrZXROYW1lLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUXVldWVVcmwnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBkb21haW5FdmVudHNRdWV1ZS5xdWV1ZVVybCxcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=