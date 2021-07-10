import * as sst from "@serverless-stack/resources";

export default class MyStack extends sst.Stack {
    constructor(scope: sst.App, id: string, props?: sst.StackProps) {
        super(scope, id, props);

        // Create the Identity Pool
        const auth = new sst.Auth(this, `Auth`, {
          cognito: false,
          apple: {
            servicesId: "TODO: Insert service id"
          },
          identityPool: {
            allowUnauthenticatedIdentities: false,
            allowClassicFlow: true
          }
        })
    }
}
