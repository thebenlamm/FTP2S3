const { Stack, Duration } = require('aws-cdk-lib');
const { Effect, PolicyStatement, Role, ServicePrincipal } = require('aws-cdk-lib/aws-iam');
const { Code, Function, LayerVersion, Runtime } = require('aws-cdk-lib/aws-lambda');
const { Rule, Schedule } = require('aws-cdk-lib/aws-events');
const { LambdaFunction } = require('aws-cdk-lib/aws-events-targets');

class Ftp2S3Stack extends Stack {
    /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
    constructor(scope, id, props) {
        super(scope, id, props);

        const account = props.env.account;
        const region = props.env.region;

        const lambdaRole = new Role(this, 'ftp-to-s3-role', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com')
        });

        lambdaRole.addToPolicy(new PolicyStatement(
            {
                actions: ['logs:CreateLogStream', 'logs:PutLogEvents', 'logs:CreateLogGroup'],
                resources: [
                    `arn:aws:logs:${region}:${account}:log-group:/aws/lambda/${id}*`
                ]
            }
        ));

        lambdaRole.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:PutObject', 's3:ListBucket', 's3:GetObjectTagging', 's3:PutObjectTagging'],
            resources: [`arn:aws:s3:::${props.config.bucketName}/*`, `arn:aws:s3:::${props.config.bucketName}/`]
        }));

        const lambdaLayer = LayerVersion.fromLayerVersionArn(this,
            'ftp-to-s3-layer', `arn:aws:lambda:${region}:${account}:layer:${props.config.layerName}:${props.config.layerVersion}`);

        const ftp2S3BackupFunction = new Function(this, 'FTP2S3BackupFunction', {
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromAsset('resources/takebackup'),
            handler: 'index.handler',
            role: lambdaRole,
            timeout: Duration.seconds(360),
            layers: [lambdaLayer],
            memorySize: 512,
            // ephemeralStorageSize: { Size: 2048 }, // Not working. Configured in the console
            environment: {
                HOST: props.config.host,
                PORT: props.config.port,
                USERNAME: props.config.username,
                PASSWORD: props.config.password,
                BUCKET_NAME: props.config.bucketName
            }
        });

        // CloudWatch Event Rule to trigger the FTP2S3BackupFunction Lambda function daily at 2:00 AM
        new Rule(this, 'FTP2S3BackupRule', {
            description: 'Rule to trigger the FTP2S3BackupFunction Lambda function daily at 2:00 AM',
            schedule: Schedule.cron({ minute: '0', hour: '2' }),
            targets: [
                new LambdaFunction(ftp2S3BackupFunction)
            ]
        });
    }
}

module.exports = { Ftp2S3Stack };
