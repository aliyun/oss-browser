module.exports = {
  'app.name': 'OSSブラウザ',
  'language': '言語',
  'name': '名前',
  'type': 'タイプ',
  'customize': 'カスタマイズ',
  'public.cloud': 'パブリッククラウド',

  'region.oss-cn-hangzhou': '杭州 (中国東部 1)',
  'region.oss-cn-shanghai': '上海 (中国東部 2)',
  'region.oss-cn-qingdao': '青島 (中国北部 1)',
  'region.oss-cn-beijing': '北京 (中国北部 2)',
  'region.oss-cn-zhangjiakou': '張家口 (中国北部 3)',
  'region.oss-cn-huhehaote': 'フフホト (中国北部 5)',
  'region.oss-cn-shenzhen': '深セン (中国南部 1)',
  'region.oss-cn-chengdu': '成都(中国西部 1)',
  'region.oss-cn-hongkong': '香港',

  'region.oss-ap-southeast-1': 'アジア東南 1 (シンガポール)',
  'region.oss-ap-southeast-2': 'アジア東南 2 (シドニー)',
  'region.oss-ap-southeast-3': 'アジア東南 3 (クアラルンプール)',
  'region.oss-ap-southeast-5': 'アジア東南 5 (ジャカルタ)',
  'region.oss-ap-northeast-1': 'アジア東北 1 (日本)',
  'region.oss-ap-south-1': 'アジア南部 1 (ムンバイ)',

  'region.oss-us-west-1': 'シリコンバレー (米国西部 1)',
  'region.oss-us-east-1': 'バージニア (米国東部 1)',
  'region.oss-eu-central-1': 'フランクフルト (ドイツ)',
  'region.oss-me-east-1': 'ドバイ (UAE)',
  'region.oss-eu-west-1': 'イングランド (ロンドン)',

  'optional': 'オプション',
  'default': 'デフォルト',
  'auth.akLogin': 'AK ログイン',
  'auth.tokenLogin': 'トークンログイン',
  'auth.presetOssPath': 'プリセット OSS パス',
  'auth.presetOssPath.placeholder': 'オプション, 形式: oss://bucket/key/',
  'auth.id.placeholder': 'AccessKeyId',
  'auth.secret.placeholder': 'AccessKeySecret',
  'auth.stoken.placeholder': 'STS トークン',
  'auth.eptpl': 'エンドポイントテンプレート',
  'auth.eptpl.placeholder': 'デフォルト: http://{region}.aliyuncs.com',

  'auth.eptpl.popup.msg1': 'パブリッククラウドの場合は、デフォルト設定をそのまま使用できます',
  'auth.eptpl.popup.msg2': 'プライベートクラウドの場合は、次のようなカスタムエンドポイントを入力してください:',

  'auth.presetOssPath.popup.msg1': '現在使用されている AK には、すべてのバケットのアクセス権があるので、[プリセット OSS パス] を設定する必要はありません。',
  'auth.presetOssPath.popup.msg2': '現在使用されている AK は、特定バケットまたはバケット配下の特定パスに対するアクセス権しかないので、[プリセット OSS パス] を設定する必要があります',

  'auth.remember.popup.msg1': 'AK を保存するには、 [入力情報の保存] チェックボックスをチェックします。次にログインするときは、[AK 履歴] をクリックしてログインするキーを選択します。AK を手動で入力する必要はありません。 一時的に使用するコンピューターの場合、これをチェックしないでください',

  'region': 'リージョン',
  'requestPay':"request payer",
  'requestpay.popup.msg': 'あなたの許可されたバケットが要求支払人モードを開き、あなたがそのバケットの所有者ではない場合、あなたは「要求支払人モード」をチェックするべきです。 あなたがバケツを訪れたときにあなたが生み出すトラフィックやリクエストなどの量はあなたによって支払われるでしょう。詳細については、ヘルプドキュメントを参照してください',
  'auth.region.placeholder': 'オプション',
  'auth.description': '説明',
  'auth.description.placeholder': 'オプション、最大 30 文字',
  'auth.remember': '入力情報の保存',
  'auth.login': 'ログイン',
  'auth.akHistories': 'AK 履歴',

  'auth.authToken': '認証トークン',
  'auth.authToken.tooltip': 'ドキュメントの表示',
  'auth.authToken.placeholder': '認証トークンを入力してください',
  'auth.authToken.error.invalid': '有効な認証トークンを入力してください',
  'auth.authToken.error.expired': '認証トークンは期限切れです',
  'auth.authToken.info.validUntil': '{{expiration}} まで有効です。',
  'auth.authToken.info.leftTime': '残り時間',

  'auth.clearHistories': 'AK 履歴の削除',

  'actions': 'アクション',
  'use': '利用',
  'delete': '削除',
  'ok': 'OK',
  'cancel': 'キャンセル',
  'close': 'クローズ',

  'auth.removeAK.title': 'AK の削除',
  'auth.removeAK.message': 'AK <code>{{id}}</code> を削除してもよろしいですか。',

  'auth.clearAKHistories.title': 'AK 履歴の削除',
  'auth.clearAKHistories.message': '削除してもよろしいですか。',
  'auth.clearAKHistories.successMessage': 'AK 履歴は完全に削除されました。',

  'storageClassesType.standard': '標準',
  'storageClassesType.ia': '低頻度アクセス',
  'storageClassesType.archive': 'アーカイブ',

  'aclType.default': 'バケットから継承',
  'aclType.public-read-write': '公開読み書き',
  'aclType.public-read': '公開読み取り',
  'aclType.private': '非公開',

  'files': 'ファイル',
  'settings': '設定',
  'about': 'バージョン情報',
  'bookmarks': 'ブックマーク',
  'logout': 'ログアウト',
  'logout.message': 'ログアウトしてもよろしいですか。',
  'main.upgration': 'リリースノート',
  'tempCert': '一時認証',
  'setup.success': 'セットアップを完了しました',
  'forbidden': '選択したオブジェクトを現在のフォルダーまたは Region 間で移動することはできません',

  //address bar
  'backward': '戻る',
  'forward': '進む',
  'goUp': '上がる',
  'refresh': '更新',
  'home': 'ホーム',
  'saveAsHome': 'ホームページに設定',
  'saveToFav': 'ブックマークに保存',
  'saveAsHome.success': 'ホームページに設定しました',

  'bookmark.remove.success': 'ブックマークを削除しました',
  'bookmark.add.error1': 'ブックマークの追加に失敗しました: 個数の上限に達しました',
  'bookmark.add.success': 'ブックマークを追加しました',

  //bucket
  'bucket.add': 'バケットの作成',
  'bucket.multipart': 'マルチパート',
  'acl': 'ACL',
  'privilege': '権限',
  'simplePolicy': 'シンプルポリシー',
  'more': '詳細',
  'bucket.name': 'バケット名',
  'creationTime': '作成日時',
  'bucket.add.name.invalid': 'バケット名が無効です!',
  'acl.warn-not-private.public-read': '<code>公開読み取り</code>権限は、匿名でバケット内のデータにアクセスでき、 セキュリティリスクが高くなるため、 非公開 (private) を推奨します。',
  'acl.warn-not-private.public-read-write': '<code>公開読み書き</code>権限は、匿名でバケット内のデータにアクセスでき、 セキュリティリスクが高くなるため、 非公開 (private) を推奨します。',

  'multipart.management': 'マルチパート',
  'multipart.description': 'マルチパート (アップロード) プロセス中に生成されたイベントやフラグメントを管理します',
  'multipart.description.tooltip': 'つまり、初期化されたが、完了または中止のイベントが来ていないマルチパートアップロードです',

  'select.all': "すべて選択",
  'delete.selected': "選択されたものを削除",
  'delete.all': "すべて削除",

  'initiatedTime': "開始日時",

  'loading': 'ロード中...',
  'nodata': 'データなし',

  'delete.multiparts.title': 'マルチパートの削除',
  'delete.multiparts.message': '{{num}} 個のマルチパートを削除してもよろしいですか。',
  'delete.multiparts.on': '削除中...',
  'delete.multiparts.success': 'マルチパートを削除しました',

  'bucketACL.update': 'バケット ACL の更新',
  'bucketACL.update.success': '更新を完了しました',

  'bucket.add.success': '作成を完了しました',

  'bucket.delete.title': 'バケットの削除',
  'bucket.delete.message': 'バケット名: <code>{{name}}</code>, リージョン: <code>{{region}}</code>, このバケットを削除してもよろしいですか。',
  'bucket.delete.success': 'バケットを削除しました',

  'simplePolicy.title': 'ポリシー認証の簡略化',
  'simplePolicy.lb1.1': 'リソース',
  'simplePolicy.lb1.2': '権限',
  'privilege.readonly': '読み取り',
  'privilege.readwrite': '読み書き',
  'privilege.all': 'フルコントロール',
  'simplePolicy.lb3.1': 'ポリシーの表示',
  'simplePolicy.lb3.2': '圧縮',
  'simplePolicy.lb4': '名前付きポリシーの作成',

  'readonly': 'Read-Only',
  'readwrite': 'Read-Write',

  'simplePolicy.lb5': '許可',
  'subusers': 'サブユーザー',
  'usergroups': 'ユーザーグループ',
  'roles': 'ロール',

  'chooseone': '一つを選んでください',

  'simplePolicy.ok': 'OK',
  'simplePolicy.noauth.message1': 'ユーザーリストを取得する権限がありません',
  'simplePolicy.noauth.message2': 'ユーザーグループリストを取得する権限がありません',
  'simplePolicy.noauth.message3': 'ロールリストを取得する権限がありません',
  'simplePolicy.success': 'ポリシーを適用しました',

  //settings
  'settings.maxUploadNum': 'アップロード並列タスク数',
  'settings.maxDownloadNum': 'ダウンロード並列タスク数',
  'settings.WhetherShowThumbnail': '画像をサムネイル表示',
  'settings.WhetherShowThumbnail.msg': 'ファイル一覧にサムネイルを表示すると一定量のトラフィックが消費されます',
  'settings.success': '保存を完了しました',
  'settings.autoUpgrade': '自動更新',
  'settings.autoUpgrade.msg': 'アップデートパッケージを自動的にダウンロードします',
  'settings.log': 'ログ設定',
  'settings.console': '試用パネル',
  'settings.console.msg': '調査を開く',
  'settings.file': "ローカルログファイル",
  'settings.file.msg': "ログファイルをシステムローカルに保存",
  'settings.file.info': "ローカルinfoログファイル",
  'settings.file.info.msg': "infoレベルのログを地元に預かるかどうか",
  'settings.connectTimeout':'タイムアウト(ms)',
  'settings.uploadPartSize':'スライスサイズ(M)',
  'settings.uploadAndDownloadRetryTimes': '再試行回数',

    //bookmark
  'bookmarks.title': 'ブックマーク',
  'time': '時間',
  'bookmarks.delete.success': 'ブックマークを削除しました',

  'opensource.address': 'オープンするソース',
  'foundNewVersion': '新しいバージョンがあります',
  'clickToDownload': 'クリックしてダウンロード',
  'currentIsLastest': 'これは最新バージョンです',

  //files
  'upload': 'アップロード',
  'folder.create': '新しいディレクトリ',
  'folder.create.success': 'ディレクトリを作成しました',
  'folder.name': '名前',

  'download': 'ダウンロード',
  'copy': 'コピー',
  'move': '移動',
  'paste': '貼り付け',
  'rename': '名前の変更',
  'getAddress': 'アドレスの取得',
  'genAuthToken': '認証トークン',

  'rename.to': '新しい名前',
  'whetherCover.title': 'カバーの適用',
  'whetherCover.message1': '同じ名前のフォルダーをカバーされていますか',
  'whetherCover.message2': '同じ名前のファイルは既にカバーされていますか',
  'rename.success': '名前を変更しました',
  'rename.on': '名前を変更しています...',
  'folder.in': 'フォルダー',
  'file': 'ファイル',
  'folder': 'フォルダー',

  'copy.on': 'コピー中...',
  'move.on': '移動中...',

  'use.cancelled': 'ユーザーによりキャンセル',

  'copy.error1': '一部のファイルをコピーできません',
  'move.error1': '一部のファイルを移動できません',
  'copy.success': 'コピーを完了しました',
  'move.success': '移動を完了しました',

  'stop': '停止',

  'paste.resources': '現在のディレクトリに貼り付け',

  'copy.cancel': 'コピーのキャンセル',
  'move.cancel': '移動のキャンセル',

  'search.files.placeholder': '名前プレフィックスでフィルタリング',

  'genAuthToken.title': '認証トークンの生成',
  'genAuthToken.message1.1': '認証するバケット',
  'genAuthToken.message1.2': '認証するフォルダー',
  'genAuthToken.message2': '権限',

  'effective.duration': '有効期間',
  'unit.second': '秒',

  'genAuthToken.message3.1': 'ロール指定',
  'genAuthToken.message3.2': 'このロールは、この{{type}}のアクセスには少なくとも{{privilege}}権限が必要です',

  'genAuthToken.message4': '認証トークン',
  'genAuthToken.message5': '上に生成された認証コードを使用して OSS ブラウザにログインすると、{{type}} [{{object}}] にアクセスする権限を得ることができます。{{expiration}} まで有効です。',
  'genAuthToken.message6.1': '生成',
  'genAuthToken.message6.2': '再生成',

  'deleteModal.title': 'ファイルの削除',
  'deleteModal.message1': '次のディレクトリまたはファイルが削除されます',
  'delete.on': '削除中...',
  'delete.success': '削除を完了しました',
  'deleteModal.message2': 'キャンセルされました',
  'deleteModal.message3': 'いくつかのディレクトリやファイルは削除できません',

  'paste.message1': '<span class="text-info">{{name}}...</span> をこのディレクトリに<span class="text-info">{{action}}</span>しますか (同名のファイルまたはディレクトリはカバーされます)',

  'acl.update.title': 'ACL の更新',
  'acl.update.success': 'ACL を更新しました',
  'aclType.private.message': '非公開: オブジェクトに対するアクセスは認証が必要です',
  'aclType.public-read.message': '公開読み取り: オブジェクトに対する書き込みには認証が必要です。オブジェクトは誰でも読み取り可能です',
  'aclType.public-read-write.message': '公開読み書き: 誰でもオブジェクトを読み書き可能です',

  'getAddress.title': 'アドレスの取得',
  'address': 'アドレス',
  'getAddress.message': 'リンクの有効期間を入力してください',
  'generate': '生成',
  'qrcode.download': 'コードをスキャンしダウンロード',

  'restore.checker.message1': 'プレビューまたはダウンロードするためにアーカイブをリストアする必要があります。',
  'restore.immediately': 'すぐにリストア',
  'restore.checker.message2': 'アーカイブがリストアされました。有効期限',
  'restore.onprogress': 'アーカイブファイルを回復しています、しばらくお待ちください ...',
  'restore.on': '送信中...',
  'restore.success': 'リストアリクエストが送信されました',
  'restore.days': '日数',
  'restore.message2': '有効期限',
  'restore.title': 'リストア',
  'restore.msg': '復元する必要があるファイルを選択してください',
  'restore': 'リストア',

  'preview': 'プレビュー',
  'cannot.preview': 'プレビューできません',
  'cannot.preview.this.file': 'このファイルをプレビューできません。',
  'tryto.open.as.textfile': 'テキストファイルとしてオープン',
  'preview.in.web.browser': 'ブラウザでプレビュー',

  'save': '保存',
  'size': 'サイズ',
  'filesize': 'ファイルサイズ',
  'codepreview.notsupport': 'このファイルは直接オープンできません。ローカルにダウンロードしてからオープンしてください。',
  'download.file': 'ダウンロードファイル',

  'lastModifyTime': '更新日時',
  'loading.more': 'もっと読み込んでいます...',

  'download.addtolist.on': 'ダウンロードキューに追加中',
  'download.addtolist.success': 'すべて追加されました',

  'upload.addtolist.on': 'アップロードキューに追加中',
  'upload.addtolist.success': 'すべて追加されました',

  'transframe.search.placeholder': '名前またはステータスによるフィルタリング',
  'ram.search.placeholder': '名前や修正時間によって検索する',

  'start.all': 'すべて開始',
  'pause.all': 'すべて停止',
  'clear.finished': 'クリア完了',
  'clear.all': 'すべてクリア',

  'clear.all.title': 'すべてクリア',
  'clear.all.download.message': 'すべてのダウンロードタスクをクリアしてもよろしいですか。',
  'clear.all.upload.message': 'すべてのアップロードタスクをクリアしてもよろしいですか。',

  'pause.on': '停止中...',
  'pause.success': '停止を完了しました',
  'remove.from.list.title': '削除',
  'remove.from.list.message': 'このタスクを削除してもよろしいですか。',

  'status.running.uploading': 'アップロード中',
  'status.running.downloading': 'ダウンロード中',
  'status.running': '実行中',
  'status.stopped': '停止',
  'status.failed': '失敗',
  'status.finished': '完了',
  'status.waiting': '待機中',
  'status.retrying': 'やり直してみる',
  'status.retrytimes': '次',
  'status.verifying': '検証中',

  'users': 'サブユーザー',
  'users.title': 'サブユーザー',
  'user.id': 'UserId',
  'displayName': '表示名',
  'comments': 'コメント',
  'update': '更新',
  'username': 'ユーザー名',
  'details': '詳細',
  'add': '追加',
  'mobilePhone': '携帯電話',
  'ak': 'AccessKey',
  'aks': 'AccessKeys',
  'email': 'Email',

  'user.delete.title': 'ユーザーの削除',
  'user.delete.message': 'ユーザー {{name}} を削除してもよろしいですか。',
  'user.delete.on': '削除中...',
  'user.delete.success': '削除を完了しました',

  'status': '状態',
  'accessKeySecret': 'AccessKeySecret',
  'createTime': '作成日時',

  'ak.status.update.title.Active': 'AccessKey の無効化',
  'ak.status.update.title.Inactive': 'AccessKey の有効化',
  'ak.status.update.message.Active': 'このアクセスキーを<code>無効化</code>してもよろしいですか。',
  'ak.status.update.message.Inactive': 'このアクセスキーを<code class="text-success">有効化</code>してもよろしいですか。',
  'ak.delete.title': 'AccessKey の削除',
  'ak.delete.message': 'このアクセスキーを<code>削除</code>してもよろしいですか。',

  'user.update.message.tip': 'AliyunRAMFullAccess 権限を持っていることを確認してください',
  'user.list.message.tip': 'ここでは、必要なユーザー管理機能のみを提供しています。さらに拡張するには、RAM コンソールを操作してください:',

  'status.Active': 'アクティブ',
  'status.Inactive': '非アクティブ',
  'enable': '有効化',
  'disable': '無効化',
  'show': '表示',
  'can.not.get.accessKeySecret': 'AccessKeySecret を取得できません',

  'settings.subtitle.updown': '転送設定',
  'settings.subtitle.sys': 'システム設定',
  'settings.subtitle.email': 'メール送信設定',
  'settings.mailSmtp.addr': 'SMTP アドレス',
  'settings.mailSmtp.ssl': 'SSL を使用する',
  'settings.mailSmtp.from': 'メール (From)',

  'user': 'ユーザ名',
  'pass': 'パスワード',
  'test': 'テスト',

  'mail.test.title': 'テストメール',
  'mail.test.message': 'テストメッセージを <span class="text-primary">{{from}}</span> へ送信します',
  'mail.test.success': '送信を完了しました',
  'mail.send.on': '送信中...',

  'new.user': '[一個作成]',
  'new.user.name': '新規ユーザー名',
  'new.user.random.gen': '生成',
  'new.user.email.send': 'メール (To)',
  'new.user.email.noset': '最初にメール送信を設定する必要があります',
  'new.user.email.noset.open': '設定ダイアログのオープン',

  'click.copy': 'コピー',

  'http.headers': 'HTTP ヘッダー',
  'key': 'Key',
  'value': 'Value',
  'userMetaData': 'ユーザー定義のメタデータ',

  'setting.on': '設定中..',
  'setting.success': '設定を完了しました',

  'send.to': '送信先',
  'send.email': 'メールする',
  'send.now': '送信',
  'file.download.address': 'ファイルダウンロードアドレス',
  'file.download.warning': 'OSS バケットのリファラリストを設定する際、ノーリファラを選択しなかった場合、ブラウザから直接 URL にアクセスすることはできません。',

  'copy.successfully': 'クリップボードにコピー済みです',
  'click.download': 'クリックしてダウンロード',
  'qrcode.download': 'QR コードをスキャンしてダウンロード',


  'saving': '保存中',
  'save.successfully': '成功完了',
  'content.isnot.modified': '内容は変更されません',

  'logining': 'ログイン中...',
  'login.successfully': 'ログイン完了、ジャンプ中...',
  'login.endpoint.error': 'エンドポイントが正しいことを確認してください',

  'upgrade.start': '更新の開始',
  'upgrade.downloading': 'ダウンロード開始中...',
  'upgrade.download.field': '自動更新に失敗しました。インストールパッケージを手動でダウンロードしてください。',
  'upgrade.download.success': 'ダウンロードを完了しました。インストールして再起動してください',

  'Insufficient disk space': 'ディスク容量不足',

  'grant.email.title': 'OSSブラウザ認証',
  'grant.email.body.title': 'OSS ブラウザは現在 2 つのログイン方法をサポートしています。いずれかを選択できます:',

  'goto.create.role': 'ロールの作成',
}
