# 機械学習環境自動構築 CDK スクリプト

機械学習用に以下のリソースを作成する CDK スクリプト。

- SageMaker Notebook インスタンス
- S3 バケット
- Notebook から S3 にアクセスするための IAM Policy/Role

## 使い方

作成するプロジェクト名を `<projName>` とする。

```bash
npm run build
cdk deploy -c proj=<projName>
```

削除するときは `destroy` すればよい。  
※S3 バケットは中身が空でないと削除できない。

```bash
cdk destroy -c proj=<projName>
```

## その他

### auto-stop-idle

CfnNotebookInstance の props に渡している

```ts
lifecycleConfigName: "auto-stop-idle";
```

は、インスタンスが一時間アイドル状態だと自動でインスタンスを停止するスクリプトである。  
詳しくはスクリプトを参照：  
<https://github.com/kasegao/sagemaker-sample/blob/main/lifecycle/auto-stop-idle.sh>

### 実行権限

cdk deploy/destroy の実行には以下の権限が必要である。

- AWSCloudFormationFullAccess （正確には ReadOnly + いくつかの Write 権限でいけるらしい）
- CDKToolkit の入った S3 バケット（`cdk bootstrap` で作成されるバケット）への Read/Write 権限
- `sts:AssumeRole` で `"arn:aws:iam::*:role/cdk-*"` に該当する権限

これに加えて SageMaker の権限が必要なので、実用上は次の 4 つのポリシーをアタッチすれば十分である。

Managed Policy

- IAMReadOnlyAccess
- AmazonSageMakerFullAccess
- AWSCloudFormationFullAccess

Inline Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VisualEditor0",
      "Effect": "Allow",
      "Action": ["sts:AssumeRole", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::cdk-xxxxxxxxxxxxxxxxxxxx",
        "arn:aws:iam::*:role/cdk-*"
      ]
    },
    {
      "Sid": "VisualEditor1",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::cdk-xxxxxxxxxxxxxxxxxxxx/*"
    }
  ]
}
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template
