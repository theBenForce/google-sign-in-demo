import * as sst from "@serverless-stack/resources";
import * as iam from "@aws-cdk/aws-iam";
import * as s3 from "@aws-cdk/aws-s3";

export default class MyStack extends sst.Stack {
    constructor(scope: sst.App, id: string, props?: sst.StackProps) {
        super(scope, id, props);

        // Create the Identity Pool
        const auth = new sst.Auth(this, `Auth`, {
            cognito: false,
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
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

        bucket.s3Bucket.grantReadWrite(auth.iamAuthRole);

        // const website = new sst.StaticSite(this, "ReactSite", {
        //     path: "website",
        //     buildOutput: "build",
        //     buildCommand: "yarn build",
        //     errorPage: sst.StaticSiteErrorOptions.REDIRECT_TO_INDEX_PAGE,
        // });

        // bucket.s3Bucket.addCorsRule({
        //     allowedOrigins: [website.url],
        //     allowedMethods: [
        //         s3.HttpMethods.GET,
        //         s3.HttpMethods.POST,
        //         s3.HttpMethods.HEAD,
        //         s3.HttpMethods.PUT,
        //         s3.HttpMethods.DELETE,
        //     ],
        //     allowedHeaders: ["*"],
        //     exposedHeaders: [
        //         "x-amz-server-side-encryption",
        //         "x-amz-request-id",
        //         "x-amz-id-2",
        //         "ETag",
        //     ],
        //     maxAge: 3000,
        // });

        this.addOutputs({
            identityPoolId: auth.cognitoCfnIdentityPool.ref,
            storageBucket: bucket.bucketName,
            // website: website.url,
        });
    }
}
