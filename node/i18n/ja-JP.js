module.exports = {
  'app.name': 'OSSブラウザ',
  'language': '言語',
  'name': '名前',
  'type': 'タイプ',
  'customize': 'カスタマイズ',
  'public.cloud': 'パブリッククラウド',

  'region.oss-cn-hangzhou': '中国東部 1(杭州)',
  'region.oss-cn-shanghai': '中国東部 2(上海)',
  'region.oss-cn-qingdao': '中国北部　1(青島)',
  'region.oss-cn-beijing': '中国北部 2(北京)',
  'region.oss-cn-zhangjiakou': '中国北部 3(張家口)',
  'region.oss-cn-shenzhen': '中国南部 1(深セン)',
  'region.oss-cn-hongkong': '香港',

  'region.oss-ap-southeast-1': 'アジア東南 1 (シンガポール)',
  'region.oss-ap-southeast-2': 'アジア東南 2 (シドニー)',
  'region.oss-ap-northeast-1': 'アジア東北 1 (東京)',

  'region.oss-us-west-1': '米国西部 1(シリコンバレー)',
  'region.oss-us-east-1': '米国東部 1(バージニア)',
  'region.oss-eu-central-1': '中央ヨーロッパ1（フランクフルト）',
  'region.oss-me-east-1': '中東 1 (ドバイ)',

  'optional': 'オプション',
  'default': 'デフォルト',
  'auth.akLogin': 'AK ログイン',
  'auth.tokenLogin': 'Token ログイン',
  'auth.presetOssPath': 'プリセットOSSパス',
  'auth.presetOssPath.placeholder': 'オプション, フォーマット: oss://bucket/key/',
  'auth.id.placeholder': 'AccessKeyId',
  'auth.secret.placeholder': 'AccessKeySecret',
  'auth.eptpl': 'エンドポイントテンプレート',
  'auth.eptpl.placeholder': 'デフォルト: http://{region}.aliyuncs.com',

  'auth.eptpl.popup.msg1': 'パブリッククラウドの場合は、デフォルト設定をそのまま使用できます',
  'auth.eptpl.popup.msg2': 'プライベートクラウドの場合は、次のようなカスタムエンドポイントを入力してください。:',

  'region': 'リージョン',
  'auth.region.placeholder': 'リージョン',
  'auth.description': '説明',
  'auth.description.placeholder': 'オプション、最大30単語',
  'auth.remember': '覚えている',
  'auth.login': 'ログイン',
  'auth.akHistories': 'AK の歴史',

  'auth.authToken': 'Auth-Token',
  'auth.authToken.tooltip': 'ドキュメントを表示する',
  'auth.authToken.placeholder': '認証トークンを入力してください',
  'auth.authToken.error.invalid': '有効な認証トークンを入力してください',
  'auth.authToken.error.expired': '認証トークンは期限切れです',
  'auth.authToken.info.validUntil': '{{expiration}}まで有効です。',
  'auth.authToken.info.leftTime': '残した時間',

  'auth.clearHistories': 'AK 履歴削除',

  'actions': 'アクション',
  'use': '利用',
  'delete': '削除',
  'ok': 'OK',
  'cancel': 'キャンセル',
  'close': 'クローズ',

  'auth.removeAK.title': 'AK削除',
  'auth.removeAK.message': '本当にAKを削除しますか：{{id}}？',

  'auth.clearAKHistories.title': 'AK 履歴削除',
  'auth.clearAKHistories.message': '確定ですか?',
  'auth.clearAKHistories.successMessage': 'すべてのAKの歴史は削除された',

  'storageClassesType.standard': '標準',
  'storageClassesType.ia': 'IA',
  'storageClassesType.archive': 'アーカイブ',

  'aclType.default': 'バケットから継承する',
  'aclType.public-read-write': 'パブリック読み取りと書き込み',
  'aclType.public-read': '一般公開',
  'aclType.private': 'プライベート',

  'files': 'ファイル',
  'settings': '設定',
  'about': '約',
  'bookmarks': 'ブックマーク',
  'logout': 'ログアウト',
  'logout.message': 'ログアウトしてもよろしいですか?',
  'main.upgration': 'リリースノート',
  'tempCert': 'Temp Cert',
  'setup.success': 'セットアップに成功しました',

  //address bar
  'backward': '後退',
  'forward': '進む',
  'goUp': '上がる',
  'refresh': 'リフレッシュ',
  'home': 'ホーム',
  'saveAsHome': 'ホームページを設定する',
  'saveToFav': 'ブックマークに保存',
  'saveAsHome.success': 'ホームページの設定は成功',

  'bookmark.remove.success': 'ブックマークの削除は成功',
  'bookmark.add.error1': 'ブックマークの追加に失敗しました: 最大限を超える',
  'bookmark.add.success': 'ブックマークの追加は成功しました',

  //bucket
  'bucket.add': 'バケットの作成',
  'bucket.multipart': 'マルチパート',
  'acl': 'ACL',
  'privilege': '権限',
  'simplePolicy': 'シンプルポリシー',
  'more': 'さらに',
  'bucket.name': 'バケット名',
  'creationTime': '作成時間',

  'multipart.management': 'マルチパート',
  'multipart.description': 'マルチパート（アップロード）プロセス中に生成されたイベントやフラグメントを管理する',
  'multipart.description.tooltip': 'つまり、初期化されたマルチパートアップロードではなく、完全またはアボートのマルチパートアップロードイベントではない',

  'select.all': "すべて選択",
  'delete.selected': "選択を削除します",
  'delete.all': "すべて削除",

  'initiatedTime': "開始時間",

  'loading': 'Loading...',
  'nodata': 'データなし',

  'delete.multiparts.title': 'マルチパートを削除する',
  'delete.multiparts.message': '{{num}}マルチパートを削除してもよろしいですか？',
  'delete.multiparts.on': '削除中...',
  'delete.multiparts.success': 'マルチパートを正常に削除しました',

  'bucketACL.update': 'アップデートバケット ACL',
  'bucketACL.update.success': '更新に成功しました',

  'bucket.add.success': '正常に作成されました',

  'bucket.delete.title': 'バケット削除',
  'bucket.delete.message': 'バケット名:<code>{{name}}</code>, リジョン:<code>{{region}}</code>, このバケットを削除してもよろしいですか？',
  'bucket.delete.success': 'バケットを正常に削除しました',

  'simplePolicy.title': 'ポリシー承認を簡素化する',
  'simplePolicy.lb1.1': 'リソース',
  'simplePolicy.lb1.2': '権限',
  'privilege.readonly': 'ReadOnly',
  'privilege.readwrite': '読み書き',
  'privilege.all': '読み書き',
  'simplePolicy.lb3.1': 'ポリシーの表示',
  'simplePolicy.lb3.2': '崩壊',
  'simplePolicy.lb4': '名前付きポリシーの作成',

  'readonly': 'Read-Only',
  'readwrite': 'Read-Write',

  'simplePolicy.lb5': '許可',
  'subusers': 'サブユーザー',
  'usergroups': 'ユーザー・グループ',
  'roles': 'ロール',

  'chooseone': '一つを選んでください',

  'simplePolicy.ok': 'OK',
  'simplePolicy.noauth.message1': 'ユーザーリストを取得する権限がありません',
  'simplePolicy.noauth.message2': '使用グループリストを取得する権限がありません',
  'simplePolicy.noauth.message3': 'ロールリストを取得する権限がありません',
  'simplePolicy.success': 'ポリシーを正常に適用する',

  //settings
  'settings.maxUploadNum': 'タスクの並行番号をアップロードする',
  'settings.maxDownloadNum': 'タスク並行番号をダウンロードする',
  'settings.WhetherShowThumbnail': '画像のサムネイルを表示するかどうか',
  'settings.WhetherShowThumbnail.msg': 'ファイル一覧にサムネイルを表示すると一定量のトラフィックが消費されます',
  'settings.success': '正常に保存',

  //bookmark
  'bookmarks.title': 'ブックマーク',
  'time': '時間',
  'bookmarks.delete.success': 'ブックマークを正常に削除しました',

  'opensource.address': 'オープンソース',
  'foundNewVersion': '新しいバージョンを見つけました',
  'clickToDownload': 'クリックしてダウンロードする',
  'currentIsLastest': 'これは最新バージョンです！',

  //files
  'upload': 'アップロード',
  'folder.create': 'ディレクトリ',
  'folder.create.success': 'ディレクトリが正常に作成されました',
  'folder.name': "名前",

  'download': 'ダウンロード',
  'copy': 'コピー',
  'move': '移動',
  'paste': 'ペースト',
  'rename': '名前を変更する',
  'getAddress': '住所',
  'genAuthToken': '認証トークン',

  'rename.to': '名前を変更する',
  'whetherCover.title': 'カバーするかどうか',
  'whetherCover.message1': '同じ名前のフォルダはありますか？',
  'whetherCover.message2': '同じ名前のファイルは既にカバーされていますか？',
  'rename.success': '名前の変更に成功しました',
  'rename.on': '名前を変更しています...',
  'folder.in': 'フォルダ',
  'file': 'ファイル',
  'folder': 'フォルダ',

  'copy.on': 'コピー中...',
  'move.on': '移動中...',

  'use.cancelled': 'ユーザーによってキャンセル',

  'copy.error1': '一部のファイルをコピーできません',
  'move.error1': '一部のファイルは移動できません',
  'copy.success': '正常にコピーされました',
  'move.success': '正常に移動いた',

  'stop': '停止',

  'paste.resources': '現在のディレクトリに貼り付け',

  'copy.cancel': 'コピーをキャンセル',
  'move.cancel': '移動をキャンセル',

  'search.files.placeholder': '名前プレフィックスをフィルタリングする',

  'genAuthToken.title': '認証トークンを生成する',
  'genAuthToken.message1.1': 'バケットに承認する',
  'genAuthToken.message1.2': 'フォルダに承認する',
  'genAuthToken.message2': '権限',

  'effective.duration': '有効期間',
  'unit.second': 's',

  'genAuthToken.message3.1': 'ロールを指定する必要があります',
  'genAuthToken.message3.2': 'このロールは、この{{type}}にアクセスするための少なくとも{{privilege}}権限が必要です。',

  'genAuthToken.message4': '認証トークン',
  'genAuthToken.message5': '記の生成された認証コードを使用してOSSブラウザにログインすると、この{{type}} [{{object}}]にアクセスする権限を得ることができます。{{expiration}}まで有効です。',
  'genAuthToken.message6.1': '生成する',
  'genAuthToken.message6.2': '再生成する',

  'deleteModal.title': 'これらのファイルを削除する',
  'deleteModal.message1': '次のディレクトリまたはファイルが削除されます',
  'delete.on': '削除中...',
  'delete.success': '正常に削除されました',
  'deleteModal.message2': 'キャンセルされました',
  'deleteModal.message3': 'いくつかのディレクトリやファイルは削除できません',

  'paste.message1': 'このディレクトリに{{action}} <span class="text-info">{{name}}...</span>  (同じファイルまたはディレクトリが対象となります)？',

  'acl.update.title': 'Updateを更新する',
  'acl.update.success': 'ACLは正常に更新されました',
  'aclType.private.message': 'プライベート: オブジェクトへのすべてのアクセスを認証する必要がある',
  'aclType.public-read.message': '一般公開: オブジェクト認証の操作のために書く必要があります。オブジェクトは匿名で読み取ることができます',
  'aclType.public-read-write.message': 'パブリックの読み書き: 誰もがオブジェクトを読み書きできます',

  'getAddress.title': 'アドレスを取得する',
  'address': 'アドレス',
  'getAddress.message': 'リンクの有効期間を入力してください',
  'generate': '生成',
  'qrcode.download': 'コードをスキャンしダウンロードする',

  'restore.checker.message1': 'プレビューまたはダウンロードするためにアーカイブを復元する必要があります。',
  'restore.immediately': 'すぐに復元する',
  'restore.checker.message2': 'アーカイブが復元されました。有効期限',
  'restore.onprogress': 'アーカイブファイルが回復しています、しばらくお待ちください ...',
  'restore.on': '送信...',
  'restore.success': '復元要求が正常に送信されました',
  'restore.days': '日々',
  'restore.message2': '有効期限',
  'restore.title': 'リストア',
  'restore': 'リストア',

  'preview': 'プレビュー',
  'cannot.preview': 'プレビューできません',
  'cannot.preview.this.file': 'このファイルをプレビューできません。',
  'tryto.open.as.textfile': 'テキストファイルとして開こうとする',

  'save': 'セーブ',
  'size': 'サイズ',
  'filesize': 'ファイルサイズ',
  'codepreview.notsupport': 'このファイルは直接開くことはできません。ローカルにダウンロードしてから開いてください。',
  'download.file': 'ダウンロードファイル',

  'lastModifyTime': '最終更新日',
  'loading.more': 'もっと読み込んでいます...',

  'download.addtolist.on': 'Being added to the download queue',
  'download.addtolist.success': 'All added',

  'upload.addtolist.on': 'ダウンロードキューに追加中',
  'upload.addtolist.success': 'すべて追加されました',

  'transframe.search.placeholder': '名前またはステータスによるフィルタリング',

  'start.all': 'すべて開始',
  'pause.all': 'すべてを止める',
  'clear.finished': 'クリア完了',
  'clear.all': 'すべてクリア',

  'clear.all.title': 'すべてクリア',
  'clear.all.download.message': 'すべてのダウンロードタスクをクリアしてもよろしいですか？',
  'clear.all.upload.message': 'すべてのアップロードタスクをクリアしますか？',

  'pause.on': '停止中...',
  'pause.success': '正常に停止しました',
  'remove.from.list.title': '削除',
  'remove.from.list.message': 'このタスクを削除してもよろしいですか？',

  'status.running.uploading': 'アップロード中',
  'status.running.downloading': 'ダウンロード中',
  'status.running': 'ランニング',
  'status.stopped': '停止',
  'status.failed': '失敗',
  'status.finished': '完了',
  'status.waiting': '待っている',

  'users': 'サブユーザ',
  'users.title': 'サブユーザ',
  'user.id': 'ユーザーID',
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

  'user.delete.title': 'ユーザーを削除する',
  'user.delete.message': 'このユーザーを削除してもよろしいですか: {{name}}?',
  'user.delete.on': '削除中...',
  'user.delete.success': 'ユーザーを削除された',

  'status': '状態',
  'accessKeySecret': 'AccessKeySecret',
  'createTime': '作成時間',

  'ak.status.update.title.Active': 'AccessKey無効化',
  'ak.status.update.title.Inactive': 'AccessKey有効化',
  'ak.status.update.message.Active': 'このアクセスキーを<code>無効化</code>しますか？',
  'ak.status.update.message.Inactive': 'このアクセスキーを<code class="text-success">有効化</code>しますか？',
  'ak.delete.title': 'AccessKey削除',
  'ak.delete.message': 'このアクセスキーを<code>削除</code>しますか？',

  'user.update.message.tip': 'AliyunRAMFullAccess権限を持っていることを確認してください',
  'user.list.message.tip': 'ここでは、必要なユーザー管理機能のみを提供しています。さらに拡張するために、RAMコンソールを操作してください:',

  'status.Active': 'アクティブ',
  'status.Inactive': '非アクティブ',
  'enable': '有効にする',
  'disable': '無効にする',
  'show': '表示',
  'can.not.get.accessKeySecret': 'AccessKeySecret取得できません',

  'settings.subtitle.updown': '転送設定',
  'settings.subtitle.sys': 'システム設定',
  'settings.subtitle.email': 'メール送信設定',
  'settings.mailSmtp.addr': 'SMTPアドレス',
  'settings.mailSmtp.ssl': 'SSLを使用する',
  'settings.mailSmtp.from': 'Email(From)',

  'user': 'ユーザ名前',
  'pass': 'パスワード',
  'test': 'テスト',

  'mail.test.title': 'テストメール',
  'mail.test.message': 'テストメッセージを: <span class="text-primary">{{from}}</span>へ送信する',
  'mail.test.success': '正常に送信されました',
  'mail.send.on': '送信中...',

  'new.user': '[ 一つ作る ]',
  'new.user.name': '新しいユーザーネーム',
  'new.user.random.gen': '生成',
  'new.user.email.send': 'Email (to)',
  'new.user.email.noset': 'メール送信の設定を最初に設定する必要があります',
  'new.user.email.noset.open': '設定を開く',

  'click.copy': 'コピー',

  'http.headers': 'Http ヘッダー',
  'key': 'Key',
  'value': 'Value',
  'userMetaData': 'ユーザー定義のメタデータ',

  'setting.on': '設定中..',
  'setting.success': '設定完了',

  'send.to': '送信先',
  'send.email': 'メールする',
  'send.now': '送信',

}
