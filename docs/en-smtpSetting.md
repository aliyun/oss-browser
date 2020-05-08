# Email sending settings

## Examples:

**_Application scenario: 1. Simplify policy authorization; 2. Generate file authorization code; 3. Generate file download link; Send mail function in these three cases_**

#### 1. QQ Mail:

`Note`: For the `535` error that occurs during the QQ login process, the user needs to log in to the QQ mailbox settings page to enable the smtp service and set the authorization code. Remember that the password for sending the mailbox is not the password for registration, but the authorization code.

```
"host": "smtp.qq.com",
"port": 465,
"secure": true
```

#### 2. Gmail:

```
"host": "smtp.gmail.com",
"port": 465,
"secure": true
```

#### 3. 126

```
"host": "smtp.126.com",
"port": 465,
"secure": true
```

#### 4. 163

```
"host": "smtp.163.com",
"port": 465,
"secure": true
```
