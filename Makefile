
VERSION=1.3.3
NAME=oss-browser
CUSTOM=./custom

GULP=node ./node_modules/gulp/bin/gulp.js
PKGER=node node_modules/electron-packager/cli.js
ZIP=node zip.js

ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/
ELECTRON_VERSION=1.6.5
BUILD=ELECTRON_MIRROR=$(ELECTRON_MIRROR) $(PKGER) ./dist $(NAME) --asar --overwrite --out=build --version $(ELECTRON_VERSION)


i:
	cnpm i
clean:
	rm -rf dist node_modules build releases node/crc64/cpp-addon/node_modules node/ossstore/node_modules
dev:
	NODE_ENV=development electron .

run:
	custom=$(CUSTOM) npm run dev

prod:
	npm run prod
watch:
	$(GULP) watch --custom=$(CUSTOM)
build:
	$(GULP) build --custom=$(CUSTOM)

win64:
	$(BUILD) --platform=win32 --arch=x64
	rm -rf releases/$(VERSION)/$(NAME)-win32-x64.zip && mkdir -p releases/$(VERSION)
	$(ZIP) releases/$(VERSION)/$(NAME)-win32-x64.zip build/$(NAME)-win32-x64/
win32:
	$(BUILD) --platform=win32 --arch=ia32
	rm -rf releases/$(VERSION)/$(NAME)-win32-ia32.zip && mkdir -p releases/$(VERSION)
	$(ZIP) releases/$(VERSION)/$(NAME)-win32-ia32.zip build/$(NAME)-win32-ia32/
linux64:
	$(BUILD) --platform=linux --arch=x64
	rm -rf releases/$(VERSION)/$(NAME)-linux-x64.zip && mkdir -p releases/$(VERSION)
	$(ZIP) releases/$(VERSION)/$(NAME)-linux-x64.zip build/$(NAME)-linux-x64/
linux32:
	$(BUILD) --platform=linux --arch=ia32
	rm -rf releases/$(VERSION)/$(NAME)-linux-ia32.zip && mkdir -p releases/$(VERSION)
	$(ZIP) releases/$(VERSION)/$(NAME)-linux-ia32.zip build/$(NAME)-linux-ia32/
mac:
	$(BUILD) --platform=darwin --arch=x64 --icon=$(CUSTOM)/icon.icns
	rm -rf releases/$(VERSION)/$(NAME)-darwin-x64.zip && mkdir -p releases/$(VERSION)
	$(ZIP) releases/$(VERSION)/$(NAME)-darwin-x64.zip build/$(NAME)-darwin-x64/
dmg:
	rm build/$(NAME)-darwin-x64/LICENSE* build/$(NAME)-darwin-x64/version
	ln -s /Applications/ build/$(NAME)-darwin-x64/Applications
	#cp dist/icons/icon.icns build/$(NAME)-darwin-x64/.VolumeIcon.icns
	#mkdir -p build/$(NAME)-darwin-x64/.background
	#cp dist/icons/background.tiff build/$(NAME)-darwin-x64/.background
	rm -f releases/$(VERSION)/$(NAME).dmg
	hdiutil create -size 250M -format UDZO -srcfolder build/$(NAME)-darwin-x64 releases/$(VERSION)/$(NAME).dmg

all:win32 win64 linux32 linux64 mac
	@echo 'Done'


.PHONY:build
