ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/
ELECTRON_VERSION=1.7.5
BUILD=ELECTRON_MIRROR=$(ELECTRON_MIRROR) electron-packager ./dist --asar --overwrite --out=build --version $(ELECTRON_VERSION)
VERSION=1.2.3
NAME=oss-browser

i:
	cnpm i
clean:
	npm run clean
	find . -name .DS_Store | xargs rm -rf

dev:
	NODE_ENV=development electron .

run:
	npm run dev

prod:
	npm run prod
watch:
	npm run watch
build:
	npm run build

win64:
	$(BUILD) --platform=win32 --arch=x64
	rm -rf releases/$(VERSION)/$(NAME)-win32-x64.zip && mkdir -p releases/$(VERSION)
	cd build && zip ../releases/$(VERSION)/$(NAME)-win32-x64.zip -r $(NAME)-win32-x64
win32:
	$(BUILD) --platform=win32 --arch=ia32
	rm -rf releases/$(VERSION)/$(NAME)-win32-ia32.zip && mkdir -p releases/$(VERSION)
	cd build && zip ../releases/$(VERSION)/$(NAME)-win32-ia32.zip -r $(NAME)-win32-ia32
linux64:
	$(BUILD) --platform=linux --arch=x64
	rm -rf releases/$(VERSION)/$(NAME)-linux-x64.zip && mkdir -p releases/$(VERSION)
	cd build && zip ../releases/$(VERSION)/$(NAME)-linux-x64.zip -r $(NAME)-linux-x64
mac_build:
	$(BUILD) --platform=darwin --arch=x64 --icon=./app/icons/icon.icns
	rm -rf releases/$(VERSION)/$(NAME)-darwin-x64.zip && mkdir -p releases/$(VERSION)
	#cd build && zip ../releases/$(VERSION)/$(NAME)-darwin-x64.zip -r $(NAME)-darwin-x64
mac:mac_build
	rm build/$(NAME)-darwin-x64/LICENSE* build/$(NAME)-darwin-x64/version
	ln -s /Applications/ build/$(NAME)-darwin-x64/Applications
	#cp dist/icons/icon.icns build/$(NAME)-darwin-x64/.VolumeIcon.icns
	#mkdir -p build/$(NAME)-darwin-x64/.background
	#cp dist/icons/background.tiff build/$(NAME)-darwin-x64/.background
	rm -f releases/$(VERSION)/$(NAME).dmg
	hdiutil create -size 250M -format UDZO -srcfolder build/$(NAME)-darwin-x64 releases/$(VERSION)/$(NAME).dmg

all:win64 linux64 mac


.PHONY:build
