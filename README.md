# AWS ぷよぷよ

AWSサービスアイコンを使用したぷよぷよ風パズルゲームです。実際のAWSアーキテクチャアイコンを使用し、同じカテゴリのサービス同士を4つ以上繋げて消すゲームです。

## 🎮 ゲーム概要

### 基本ルール
- **フィールド**: 縦12マス×横6マスの格子
- **組ぷよ**: 2つ1組のAWSサービスアイコンが上から落下
- **消去条件**: 同じカテゴリのアイコンが4つ以上縦横に繋がると消滅
- **連鎖**: アイコン消滅後の重力で新たな組み合わせができると連鎖発生
- **ゲームオーバー**: 3列目の最上段にアイコンが到達すると終了

### AWSサービスカテゴリ
1. **Compute（オレンジ）- 5サービス**: Amazon EC2, AWS Lambda, Amazon Lightsail, AWS Batch, AWS Elastic Beanstalk
2. **Storage（緑）- 4サービス**: Amazon S3, Amazon EFS, Amazon EBS, Amazon FSx
3. **Database（青）- 4サービス**: Amazon Aurora, Amazon DynamoDB, Amazon ElastiCache, Amazon DocumentDB
4. **Security（赤）- 4サービス**: Amazon Cognito, Amazon GuardDuty, Amazon Inspector, Amazon Detective
5. **AI/ML（紫）- 5サービス**: Amazon Bedrock, Amazon Rekognition, Amazon Comprehend, Amazon Lex, Amazon Polly

**合計**: 5カテゴリ、22のAWSサービス

## 🎯 操作方法

| キー | 動作 |
|------|------|
| ← → | 組ぷよの左右移動 |
| ↓ | 高速落下 |
| ↑ / Space | 組ぷよの回転 |

## 🚀 セットアップ

### 前提条件
- Node.js (v14以上)
- npm または yarn

### インストール
```bash
# リポジトリをクローン
git clone <repository-url>
cd aws-puyo-game

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm start
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてゲームを開始できます。

## 📁 プロジェクト構造

```
aws-puyo-game/
├── public/
│   ├── assets/                    # AWSアイコンファイル
│   │   ├── Arch_Compute/48/      # Computeサービスアイコン
│   │   ├── Arch_Storage/48/      # Storageサービスアイコン
│   │   ├── Arch_Database/48/     # Databaseサービスアイコン
│   │   ├── Arch_Security-Identity-Compliance/48/  # Securityサービスアイコン
│   │   └── Arch_Artificial-Intelligence/48/       # AI/MLサービスアイコン
│   └── index.html
├── src/
│   ├── App.js                    # メインゲームロジック
│   ├── App.css                   # スタイルシート
│   ├── awsIconsConfig.json       # アイコン設定ファイル
│   └── index.js
└── README.md
```

## 🎨 技術仕様

### 使用技術
- **React.js**: フロントエンドフレームワーク
- **CSS3**: スタイリング（レスポンシブデザイン対応）
- **JSON**: アイコン設定管理

### 主要機能
- **正確なぷよぷよルール実装**
  - 2つ1組の組ぷよシステム
  - 4方向回転機能
  - 個別ぷよ落下システム
  - 連鎖システム
- **AWSアイコン統合**
  - 実際のAWSアーキテクチャアイコンを使用
  - カテゴリベースの判定システム
  - フォールバック機能付きアイコン表示
- **ゲーム機能**
  - スコアシステム（連鎖倍率対応）
  - NEXTぷよ表示
  - ゲームオーバー判定
  - レスポンシブデザイン

## 🔧 設定ファイル

### awsIconsConfig.json
アイコンとカテゴリの対応関係を管理するJSONファイルです。新しいAWSサービスを追加する場合は、このファイルを編集してください。

## 🎮 ゲームプレイのコツ

1. **連鎖を狙う**: 上から順番に消えるように配置すると大きな連鎖が可能
2. **カテゴリを覚える**: 各AWSサービスがどのカテゴリに属するかを覚えると戦略的にプレイできます
3. **回転を活用**: 組ぷよの回転を使って効率的に配置しましょう
4. **NEXTを確認**: 次に来る組ぷよを確認して戦略を立てましょう

## 🐛 トラブルシューティング

### アイコンが表示されない場合
1. ブラウザの開発者ツールでコンソールエラーを確認
2. `public/assets/` フォルダにアイコンファイルが存在するか確認
3. `awsIconsConfig.json` のファイル名が正確か確認

### ゲームが動作しない場合
1. Node.jsのバージョンを確認（v14以上推奨）
2. `npm install` で依存関係を再インストール
3. ブラウザのキャッシュをクリア

## 📝 開発履歴

- **v1.0.0**: 基本的なぷよぷよゲーム実装
- **v1.1.0**: AWSアイコン統合、カテゴリベース判定
- **v1.2.0**: 個別ぷよ落下システム、連鎖システム改善
- **v1.3.0**: アイコン読み込み修正、デバッグ機能追加

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。新しいAWSサービスの追加や機能改善のご提案をお待ちしています。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

- AWSアーキテクチャアイコンはAmazon Web Services, Inc.の提供によるものです
- ぷよぷよのゲームルールは株式会社セガの「ぷよぷよ」を参考にしています

---

**楽しいAWSぷよぷよライフを！** 🎮☁️
