module.exports = {
  "app.name": "OSS浏览器",
  language: "语言",
  name: "名称",
  type: "类型",
  customize: "自定义",
  "public.cloud": "公共云",
  "storage.class": "存储类型",

  "region.oss-cn-hangzhou": "华东1(杭州)",
  "region.oss-cn-shanghai": "华东2(上海)",
  "region.oss-cn-nanjing": "华东5(南京本地地域)",
  "region.oss-cn-fuzhou": "华东6(福州本地地域)",
  "region.oss-cn-qingdao": "华北1(青岛)",
  "region.oss-cn-beijing": "华北2(北京)",
  "region.oss-cn-zhangjiakou": "华北3(张家口)",
  "region.oss-cn-huhehaote": "华北5(呼和浩特)",
  "region.oss-cn-wulanchabu": "华北6(乌兰察布)",
  "region.oss-cn-shenzhen": "华南1(深圳)",
  "region.oss-cn-heyuan": "华南2(河源)",
  "region.oss-cn-chengdu": "西南1(成都)",
  "region.oss-cn-hongkong": "中国(香港)",
  "region.oss-cn-guangzhou": "华南3(广州)",

  "region.oss-ap-southeast-1": "亚太东南1(新加坡)",
  "region.oss-ap-southeast-2": "亚太东南2(悉尼)",
  "region.oss-ap-southeast-3": "亚太东南3(吉隆坡)",
  "region.oss-ap-southeast-5": "亚太东南5(雅加达)",
  "region.oss-ap-northeast-1": "日本(东京)",
  "region.oss-ap-northeast-2": "韩国(首尔)",
  "region.oss-ap-southeast-6": "菲律宾(马尼拉)",
  "region.oss-ap-southeast-7": "泰国(曼谷)",
  "region.oss-ap-south-1": "印度(孟买)",

  "region.oss-us-west-1": "美国西部1(硅谷)",
  "region.oss-us-east-1": "美国东部1(弗吉尼亚)",
  "region.oss-eu-central-1": "德国(法兰克福)",
  "region.oss-me-east-1": "阿联酋(迪拜)",
  "region.oss-eu-west-1": "英国 (伦敦)",

  optional: "可选",
  default: "默认",
  "auth.akLogin": "AK登录",
  "auth.tokenLogin": "授权码登录",
  "auth.presetOssPath": "预设OSS路径",
  "auth.presetOssPath.placeholder": "可选,格式如: oss://bucket/key/",
  "auth.id.placeholder": "请输入AccessKeyId",
  "auth.secret.placeholder": "请输入AccessKeySecret",
  "auth.stoken.placeholder": "请输入STS Token",
  "auth.eptpl": "Endpoint模板",
  "auth.eptpl.placeholder": "默认: http://{region}.aliyuncs.com",

  "auth.eptpl.popup.msg1": "公共云直接使用默认即可",
  "auth.eptpl.popup.msg2": "专有云请输入自定义Endpoint,如:",

  "auth.presetOssPath.popup.msg1":
    '大权限子账号登录: 当前使用的AK已拥有所有Bucket的权限，不需要设置"预设OSS路径"',
  "auth.presetOssPath.popup.msg2":
    '小权限子账号登录: 当前使用的AK只有某个Bucket或者Bucket下某个路径的权限，需要设置"预设OSS路径"',

  "auth.remember.popup.msg1":
    '勾选"记住秘钥"可保存AK秘钥，再次登录时，单击AK历史，可选择该秘钥登录，不需要手动输入AK。请不要在临时使用的电脑上勾选！',

  region: "区域",
  requestPay: "请求者付费模式",
  "requestpay.popup.msg":
    "如您获得授权的Bucket开启了请求付费者模式，且您不是该Bucket的拥有者，则需勾选`请求付费者模式`,其中，您访问该Bucket产生的流量、请求次数等费用, 将由您支付，详情参考帮助文档",
  "auth.region.placeholder": "可选",
  "auth.description": "备注",
  "auth.description.placeholder": "可以为空，最多30个字",
  "auth.remember": "记住秘钥",
  "auth.login": "登入",
  "auth.akHistories": "AK历史",
  "auth.secure": "HTTPS加密",
  "auth.keepLoggedIn": "保持登录",

  "auth.authToken": "授权码",
  "auth.authToken.tooltip": "点击查看帮助",
  "auth.authToken.placeholder": "请输入授权码",
  "auth.authToken.error.invalid": "请输入有效的授权码",
  "auth.authToken.error.expired": "授权码已经过期",
  "auth.authToken.info.validUntil": "有效期至{{expiration}}",
  "auth.authToken.info.leftTime": "剩余时间",

  "auth.clearHistories": "清空历史",

  actions: "操作",
  use: "使用",
  delete: "删除",
  ok: "确定",
  cancel: "取消",
  close: "关闭",

  "auth.removeAK.title": "删除AK",
  "auth.removeAK.message": "ID：<code>{{id}}</code>, 确定删除?",

  "auth.clearAKHistories.title": "清空AK历史",
  "auth.clearAKHistories.message": "确定?",
  "auth.clearAKHistories.successMessage": "已清空AK历史",

  "storageClassesType.standard": "标准类型",
  "storageClassesType.ia": "低频访问类型",
  "storageClassesType.archive": "归档存储",
  "storageClassesType.coldarchive": "冷归档存储",
  "storageClassesType.deepcoldarchive": "深度冷归档存储",

  "aclType.default": "继承Bucket",
  "aclType.public-read-write": "公共读写",
  "aclType.public-read": "公共读",
  "aclType.private": "私有",

  files: "文件",
  settings: "设置",
  about: "关于",
  bookmarks: "书签管理",
  logout: "退出",
  "logout.message": "确定要退出?",
  "main.upgration": "主要更新",
  tempCert: "临时凭证",
  "setup.success": "已经设置成功",
  forbidden: "不支持在当前路径或者跨Region移动",

  //address bar
  backward: "后退",
  forward: "前进",
  goUp: "上一级",
  refresh: "刷新",
  home: "首页",
  saveAsHome: "保存为首页",
  saveToFav: "保存书签",
  "saveAsHome.success": "设置默认地址成功",

  "bookmark.remove.success": "已删除书签",
  "bookmark.add.error1": "添加书签失败: 超过最大限制",
  "bookmark.add.success": "添加书签成功",

  //bucket
  "bucket.add": "新建 Bucket",
  "bucket.multipart": "碎片",
  acl: "ACL权限",
  privilege: "权限",
  simplePolicy: "简化Policy授权",
  more: "更多",
  "bucket.name": "Bucket名称",
  creationTime: "创建时间",
  "bucket.add.name.invalid": "您输入的Bucket名称无效",
  "acl.warn-not-private.public-read":
    "<code>公共读（public-read）</code>权限可以不通过身份验证直接读取您 Bucket 中的数据，安全风险高，为确保您的数据安全，不推荐此配置，建议您选择私有（private）。",
  "acl.warn-not-private.public-read-write":
    "<code>公共读写（public-read-write）</code>权限可以不通过身份验证直接读取您 Bucket 中的数据，安全风险高，为确保您的数据安全，不推荐此配置，建议您选择私有（private）。",

  "multipart.management": "Multipart管理",
  "multipart.description":
    "管理通过Multipart（分块）方式上传过程中产生的事件与碎片。",
  "multipart.description.tooltip":
    "即已经被初始化的Multipart Upload但是未被Complete或者Abort的Multipart Upload事件",

  "select.all": "全选",
  "delete.selected": "删除所选",
  "delete.all": "删除所有",

  initiatedTime: "最初创建时间",

  loading: "正在载入...",
  nodata: "没有数据",

  "delete.multiparts.title": "删除碎片",
  "delete.multiparts.message": "删除{{num}}个碎片, 确定删除吗？",
  "delete.multiparts.on": "正在删除碎片...",
  "delete.multiparts.success": "删除碎片成功",

  "bucketACL.update": "修改Bucket权限",
  "bucketACL.update.success": "修改Bucket权限成功",

  "bucket.add.success": "创建Bucket成功",

  "bucket.delete.title": "删除Bucket",
  "bucket.delete.message":
    "Bucket名称:<code>{{name}}</code>, 所在区域:<code>{{region}}</code>, 确定删除？",
  "bucket.delete.success": "删除Bucket成功",

  "simplePolicy.title": "简化Policy授权",
  "simplePolicy.lb1.1": "将下列资源",
  "simplePolicy.lb1.2": "的权限",
  "privilege.readonly": "只读",
  "privilege.readwrite": "读写",
  "privilege.all": "完全控制",
  "simplePolicy.lb3.1": "查看Policy",
  "simplePolicy.lb3.2": "隐藏Policy",
  "simplePolicy.lb4": "创建为policy，命名为",

  readonly: "只读",
  readwrite: "可写",

  "simplePolicy.lb5": "并授权给",
  subusers: "子用户",
  usergroups: "用户组",
  roles: "角色",

  chooseone: "请选择",

  "simplePolicy.ok": "确定授权",
  "simplePolicy.noauth.message1": "没有权限获取用户列表",
  "simplePolicy.noauth.message2": "没有权限获取用户组列表",
  "simplePolicy.noauth.message3": "没有权限获取角色列表",
  "simplePolicy.success": "应用policy成功",

  //settings
  "settings.maxUploadNum": "最大上传任务数",
  "settings.maxDownloadNum": "最大下载任务数",
  "settings.WhetherShowThumbnail": "是否显示图片缩略",
  "settings.WhetherShowThumbnail.msg":
    "在文件列表中显示图片缩略, 会消耗一定的流量",
  "settings.success": "已经保存设置",
  "settings.autoUpgrade": "自动更新",
  "settings.autoUpgrade.msg": "自动下载更新包",
  "settings.log": "日志设置",
  "settings.console": "调试面板",
  "settings.console.msg": "开启调试",
  "settings.file": "本地日志文件",
  "settings.file.msg": "日志文件存储到系统本地",
  "settings.file.info": "本地info日志文件",
  "settings.file.info.msg": "是否把info级别的日志存到本地",
  "settings.connectTimeout": "超时时间(ms)",
  "settings.uploadPartSize": "分片大小(M)",
  "settings.downloadConcurrecyPartSize": "并发分片下载数",
  "settings.uploadAndDownloadRetryTimes": "重试次数",
  "settings.other": "其他设置",
  "settings.other.list.object.max.number": "单次列举Object最大数量",

  //bookmark
  "bookmarks.title": "书签管理",
  time: "时间",
  "bookmarks.delete.success": "删除书签成功",

  "opensource.address": "开源地址",
  foundNewVersion: "发现新版本",
  clickToDownload: "点此下载",
  currentIsLastest: "当前是最新版本!",

  //files
  upload: "上传",
  "folder.create": "创建目录",
  "folder.create.success": "创建目录成功",
  "folder.name": "目录名",

  download: "下载",
  copy: "复制",
  move: "移动",
  paste: "粘贴",
  rename: "重命名",
  getAddress: "获取地址",
  genAuthToken: "生成授权码",

  "rename.to": "重命名",
  "whetherCover.title": "是否覆盖",
  "whetherCover.message1": "已经有同名目录，是否覆盖?",
  "whetherCover.message2": "已经有同名文件，是否覆盖?",
  "rename.success": "重命名成功",
  "rename.on": "正在重命名...",
  "folder.in": "所在目录",
  file: "文件",
  folder: "目录",

  "copy.on": "正在复制...",
  "move.on": "正在移动...",

  "use.cancelled": "用户取消",

  "copy.error1": "部分目录或文件无法复制",
  "move.error1": "部分目录或文件无法移动",
  "copy.success": "复制成功",
  "move.success": "移动成功",

  stop: "停止",

  "paste.resources": "粘贴到本目录",

  "copy.cancel": "取消复制",
  "move.cancel": "取消移动",

  "search.files.placeholder": "按名称前缀过滤",
  "search.files.num_msg":
    "当前已加载的目录及Object数量为{{num}}，并非当前Bucket的总共Object数量。",

  "genAuthToken.title": "生成授权码",
  "genAuthToken.message1.1": "授权给Bucket",
  "genAuthToken.message1.2": "授权给目录",
  "genAuthToken.message2": "的权限",

  "effective.duration": "有效时长",
  "unit.second": "秒",

  "genAuthToken.message3.1": "还需要指定一个角色",
  "genAuthToken.message3.2":
    "这个角色需要至少有这个{{type}}的{{privilege}}权限",

  "genAuthToken.message4": "生成的授权码",
  "genAuthToken.message5":
    "使用上面生成的授权码登录OSS浏览器，可以达到只拥有[{{object}}]这个{{type}}的{{privilege}}权限的效果,有效期至{{expiration}}。",
  "genAuthToken.message6.1": "确定生成",
  "genAuthToken.message6.2": "重新生成",

  "deleteModal.title": "删除目录和文件",
  "deleteModal.message1": "将删除以下目录或文件",
  "delete.on": "正在删除...",
  "delete.success": "删除成功",
  "deleteModal.message2": "用户取消删除",
  "deleteModal.message3": "部分目录或文件无法删除",

  "paste.message1":
    '将 <span class="text-info">{{name}}等</span> <span class="text-info">{{action}}</span> 到这个目录下面（如有相同的文件或目录则覆盖）？',

  "acl.update.title": "设置ACL权限",
  "acl.update.success": "修改ACL权限成功",
  "aclType.private.message": "私有：对object的所有访问操作需要进行身份验证",
  "aclType.public-read.message":
    "公共读：对object写操作需要进行身份验证；可以对object进行匿名读",
  "aclType.public-read-write.message":
    "公共读写：所有人都可以对object进行读写操作",

  "getAddress.title": "获取地址",
  address: "地址",
  "getAddress.message": "请输入链接有效期",
  generate: "生成",
  "qrcode.download": "扫码下载",
  not_use_own_domain: "不使用其他域名",
  custom_domain: "其他域名",

  "restore.checker.message1": "归档文件，需要解冻才能预览或下载。",
  "restore.immediately": "立即解冻",
  "restore.checker.message2": "归档文件已解冻，可读截止时间",
  "restore.onprogress": "归档文件正在解冻中，请耐心等待...",
  "restore.on": "提交中...",
  "restore.success": "解冻请求已经提交",
  "restore.days": "解冻天数",
  "restore.message2": "可读截止时间",
  "restore.title": "解冻",
  "restore.msg": "选择需要解冻的文件",
  restore: "解冻",

  preview: "预览",
  "cannot.preview": "无法预览",
  "cannot.preview.this.file": "该文件类型无法预览。",
  "tryto.open.as.textfile": "尝试作为文本文件打开",
  "preview.in.web.browser": "在浏览器中预览",

  save: "保存",
  size: "大小",
  filesize: "文件大小",
  "codepreview.notsupport": "不支持直接打开，请下载到本地后打开。",
  "download.file": "下载文件",

  lastModifyTime: "最后修改时间",
  "loading.more": "正在加载更多...",

  "download.addtolist.on": "正在添加到下载队列",
  "download.addtolist.success": "已全部添加到下载队列",

  "upload.addtolist.on": "正在添加到上传队列",
  "upload.addtolist.success": "已全部添加到上传队列",

  "transframe.search.placeholder": "根据名称或状态搜索",
  "ram.search.placeholder": "根据名称或修改时间搜索",

  "start.all": "启动全部",
  "pause.all": "暂停全部",
  "clear.finished": "清空已完成",
  "clear.all": "清空全部",

  "clear.all.title": "清空全部",
  "clear.all.download.message": "确定清空所有下载任务?",
  "clear.all.upload.message": "确定清空所有上传任务?",

  "pause.on": "正在暂停...",
  "pause.success": "暂停成功",
  "remove.from.list.title": "从列表中移除",
  "remove.from.list.message": "确定移除该任务?",

  "status.running.uploading": "正在上传",
  "status.running.downloading": "正在下载",
  "status.running": "运行中",
  "status.stopped": "已停止",
  "status.failed": "失败",
  "status.finished": "完成",
  "status.waiting": "等待",
  "status.retrying": "重试中",
  "status.retrytimes": "次",
  "status.verifying": "正在校验",

  users: "子用户",
  "users.title": "子用户管理",
  "user.id": "用户ID",
  displayName: "显示名",
  comments: "描述",
  update: "修改",
  username: "用户名",
  details: "详情",
  add: "添加",
  mobilePhone: "手机号",
  ak: "AccessKey",
  aks: "AccessKeys",
  email: "邮箱",

  "user.delete.title": "删除用户",
  "user.delete.message": "确定要删除[{{name}}]这个用户？",
  "user.delete.on": "正在删除...",
  "user.delete.success": "删除用户成功",

  status: "状态",
  accessKeySecret: "AccessKeySecret",
  createTime: "创建时间",

  "ak.status.update.title.Active": "禁用AccessKey",
  "ak.status.update.title.Inactive": "启用AccessKey",
  "ak.status.update.message.Active": "确定要禁用该AccessKey？",
  "ak.status.update.message.Inactive": "确定要启用该AccessKey？",
  "ak.delete.title": "删除AccessKey",
  "ak.delete.message": "确定要删除该AccessKey？",

  "user.update.message.tip":
    "请自行确保当前操作登录用户需要有 AliyunRAMFullAccess 权限。",
  "user.list.message.tip":
    "这里只提供必要的用户管理功能，更进一步的增强功能，请到RAM控制台操作:",

  "status.Active": "已启用",
  "status.Inactive": "已禁用",
  enable: "启用",
  disable: "禁用",
  show: "显示",
  "can.not.get.accessKeySecret": "无法获取 AccessKeySecret",

  "settings.subtitle.updown": "上传下载设置",
  "settings.subtitle.sys": "系统设置",
  "settings.subtitle.email": "邮件发送设置",
  "settings.mailSmtp.addr": "SMTP地址",
  "settings.mailSmtp.ssl": "使用SSL",
  "settings.mailSmtp.from": "发送邮件的邮箱",

  user: "用户名",
  pass: "密码",
  test: "测试一下",

  "mail.test.title": "测试邮件",
  "mail.test.message": "将发送测试邮件到: {{from}}",
  "mail.test.success": "邮件发送成功",
  "mail.send.on": "正在发送...",

  "new.user": "[ 新建一个 ]",
  "new.user.name": "新用户名",
  "new.user.random.gen": "随机生成",
  "new.user.email.send": "AK发送到邮件",
  "new.user.email.noset": "还没设置邮件发送配置，需要先设置",
  "new.user.email.noset.open": "打开设置",

  "click.copy": "点击复制",

  "http.headers": "HTTP头",
  key: "参数",
  value: "值",
  userMetaData: "用户自定义元数据",

  "setting.on": "正在设置..",
  "setting.success": "设置成功",

  "send.to": "发送到",
  "send.email": "发送邮件",
  "send.now": "立即发送",
  "file.download.address": "文件下载地址",
  "file.download.warning":
    "如果您设置了Referer 白名单且Referer不允许为空，则通过浏览器直接访问该URL会失败",

  "file.op.set_symlink": "设置软链接",
  "file.attr.symlink_src": "源文件（全路径）",
  "file.attr.symlink_file": "软链接文件目录",
  "file.message.symlink_help{target}!lines":
    "软链接文件\n源文件地址：{{target}}\n您可以通过该文件链接访问到源文件内容。",
  "file.message.symlink_rule{min,max}!html!lines":
    "软链接文件目录命名规范：\n举例：当前目录 filename 或指定目录 aaa/bbb/filename。\n1. 不允许使用表情符；\n2. / 用于分割路径，不要以 / 开头或结尾，不要出现连续的 /；\n3. 不允许出现名为 .. 的子目录；\n4. 总长度控制在 {{min}}-{{max}} 个字符。",
  "file.md.name.error.emoji":
    "目录路径中不允许出现表情符，请使用符合要求的 UTF-8 字符",
  "file.md.name.error.2dots": "目录路径中不允许出现名为「..」的子目录。",
  "file.md.name.error.continuous slash": "目录路径不允许出现连续的「/」",
  "file.message.validation_end_slash!html": "目录名不能以 / 或 \\ 开头。",

  "copy.successfully": "已复制到剪贴板",
  "click.download": "点此下载",

  saving: "正在保存",
  "save.successfully": "保存成功",
  "content.isnot.modified": "内容没有修改",

  logining: "正在登录中...",
  "login.successfully": "登录成功，正在跳转...",
  "login.endpoint.error": "请确定Endpoint是否正确",

  "upgrade.start": "开始更新",
  "upgrade.downloading": "正在下载...",
  "upgrade.download.field": "自动更新失败, 请手动下载安装包。",
  "upgrade.download.success": "已经下载成功, 现在安装并重启应用",

  "Insufficient disk space": "磁盘空间不足",

  "grant.email.title": "OSS Browser 授权",
  "grant.email.body.title":
    "OSS Browser 目前支持2种方式登录, 您可以选择任意一种:",

  "goto.create.role": "去创建角色",
  "restore.days.tips.7": "有效期范围1-7天",
};
