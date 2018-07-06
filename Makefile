
build:
	@npm run build:app
mac:
	@npm run build:mac
win:
	@npm run build:win
linux:
	@npm run build:linux

init:
	@cordova create app net.usechain uwallet; \
		cd app; \
		cordova platform add ios --save; \
		cordova platform add android --save; \
		cordova requirements

ios:
	@cd app; \
		cordova run ios

android:
	@cd app; \
		cordova run android

clean:
	@npm run build:clean

.PHONY: init build ios android
