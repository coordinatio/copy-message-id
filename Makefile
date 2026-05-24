.PHONY: all clean test-install

all:
	node build.js

clean:
	node -e "const fs=require('fs');fs.readdirSync('.').filter(f=>f.endsWith('.xpi')).forEach(f=>fs.unlinkSync(f))"

test-install: all
	node test-install.js
