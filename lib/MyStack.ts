import * as sst from "@serverless-stack/resources";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";

export default class MyStack extends sst.Stack {
    constructor(scope: sst.App, id: string, props?: sst.StackProps) {
        super(scope, id, props);

        // Create the Identity Pool
        const auth = new sst.Auth(this, `Auth`, {
            cognito: false,
            apple: {
                servicesId: process.env.APPLE_SERVICES_ID!,
            },
            identityPool: {
                allowUnauthenticatedIdentities: false,
                allowClassicFlow: true,
            },
        });

        const bucket = new sst.Bucket(this, `PhotoBucket`, {});

        auth.attachPermissionsForAuthUsers([
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                resources: [
                    `${bucket.bucketArn}/private/\${cognito-identity.amazonaws.com:sub}/*`,
                ],
            }),
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["s3:ListBucket"],
                resources: [bucket.bucketArn],
                conditions: {
                    StringLike: {
                        s3prefix: [
                            "private/${cognito-identity.amazonaws.com:sub}/",
                            "private/${cognito-identity.amazonaws.com:sub}/*",
                        ],
                    },
                },
            }),
        ]);

        const website = new sst.StaticSite(this, "ReactSite", {
            path: "website",
            buildOutput: "build",
            buildCommand: "yarn build",
            errorPage: sst.StaticSiteErrorOptions.REDIRECT_TO_INDEX_PAGE,
        });

        website.s3Bucket.addCorsRule({
            allowedOrigins: ["*"],
            allowedMethods: [s3.HttpMethods.GET],
        });

        this.addOutputs({
            identityPoolId: auth.cognitoCfnIdentityPool.ref,
            storageBucket: bucket.bucketName,
            website: website.url,
        });
    }
}
