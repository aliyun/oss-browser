
VERSION=1.12.0
NAME=oss-browser
CUSTOM=./custom

GULP=node ./node_modules/gulp/bin/gulp.js
PKGER=npx electron-packager
ZIP=node ../scripts/zip.js
GEN=node ../scripts/gen.js

ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/
ELECTRON_VERSION=9.0.3
BUILD=ELECTRON_MIRROR=$(ELECTRON_MIRROR) $(PKGER) ./dist $(NAME) --asar.unpack="*.node" --overwrite --out=build --electron-version $(ELECTRON_VERSION) --app-version $(VERSION)
ELECTON=./node_modules/.bin/electron

i:
	cnpm i || ELECTRON_MIRROR=$(ELECTRON_MIRROR) npm i
clean:
	rm -rf dist node_modules build releases node/crc64/cpp-addon/node_modules node/crc64/electron-crc64-prebuild/node_modules node/ossstore/node_modules
dev:
	NODE_ENV=development ${ELECTON} . --inspect=5858
debug:
	NODE_ENV=development ${ELECTON} . --inspect-brk=5858

run:
	custom=$(CUSTOM) npm run dev

prod:
	npm run prod
watch:
	$(GULP) watch --custom=$(CUSTOM)
build:
	$(GULP) build --custom=$(CUSTOM)
	$(GEN)

win64:
	$(BUILD) --platform=win32 --arch=x64 --icon=$(CUSTOM)/icon.ico
	cp -rf $(CUSTOM) build/$(NAME)-win32-x64/resources
	rm -rf releases/$(VERSION)/$(NAME)-win32-x64.zip && mkdir -p releases/$(VERSION)
	cd build && $(ZIP) ../releases/$(VERSION)/$(NAME)-win32-x64.zip $(NAME)-win32-x64/
win32:
	$(BUILD) --platform=win32 --arch=ia32 --icon=$(CUSTOM)/icon.ico
	cp -rf $(CUSTOM) build/$(NAME)-win32-ia32/resources
	rm -rf releases/$(VERSION)/$(NAME)-win32-ia32.zip && mkdir -p releases/$(VERSION)
	cd build && $(ZIP) ../releases/$(VERSION)/$(NAME)-win32-ia32.zip $(NAME)-win32-ia32/
linux64:
	$(BUILD) --platform=linux --arch=x64
	cp -rf $(CUSTOM) build/$(NAME)-linux-x64/resources
	rm -rf releases/$(VERSION)/$(NAME)-linux-x64.zip && mkdir -p releases/$(VERSION)
	cd build && $(ZIP) ../releases/$(VERSION)/$(NAME)-linux-x64.zip $(NAME)-linux-x64/
linux32:
	$(BUILD) --platform=linux --arch=ia32
	cp -rf $(CUSTOM) build/$(NAME)-linux-ia32/resources
	rm -rf releases/$(VERSION)/$(NAME)-linux-ia32.zip && mkdir -p releases/$(VERSION)
	cd build && $(ZIP) ../releases/$(VERSION)/$(NAME)-linux-ia32.zip $(NAME)-linux-ia32/
mac:
	$(BUILD) --platform=darwin --arch=x64 --icon=$(CUSTOM)/icon.icns
	cp -rf $(CUSTOM) build/$(NAME)-darwin-x64/$(NAME).app/Contents/Resources
	rm -rf releases/$(VERSION)/$(NAME)-darwin-x64.zip && mkdir -p releases/$(VERSION)
	cd build && $(ZIP) ../releases/$(VERSION)/$(NAME)-darwin-x64.zip $(NAME)-darwin-x64/
dmg:
	rm build/$(NAME)-darwin-x64/LICENSE* build/$(NAME)-darwin-x64/version || continue
	ln -s /Applications/ build/$(NAME)-darwin-x64/Applications || continue
	#cp dist/icons/icon.icns build/$(NAME)-darwin-x64/.VolumeIcon.icns
	#mkdir -p build/$(NAME)-darwin-x64/.background
	#cp dist/icons/background.tiff build/$(NAME)-darwin-x64/.background
	rm -f releases/$(VERSION)/$(NAME).dmg || continue
	hdiutil create -size 250M -format UDZO -srcfolder build/$(NAME)-darwin-x64 -o releases/$(VERSION)/$(NAME).dmg
all:win32 win64 linux32 linux64 mac asar
	@echo 'Done'
asar:
	mkdir -p releases/$(VERSION)/darwin-x64 && cp build/$(NAME)-darwin-x64/$(NAME).app/Contents/Resources/app.asar releases/$(VERSION)/darwin-x64
	mkdir -p releases/$(VERSION)/win32-x64 && cp build/$(NAME)-win32-x64/resources/app.asar releases/$(VERSION)/win32-x64
	mkdir -p releases/$(VERSION)/win32-ia32 && cp build/$(NAME)-win32-ia32/resources/app.asar releases/$(VERSION)/win32-ia32
	mkdir -p releases/$(VERSION)/linux-x64 && cp build/$(NAME)-linux-x64/resources/app.asar releases/$(VERSION)/linux-x64
	mkdir -p releases/$(VERSION)/linux-ia32 && cp build/$(NAME)-linux-ia32/resources/app.asar releases/$(VERSION)/linux-ia32

.PHONY:build
