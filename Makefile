XPI_NAME=copy-message-id@j.kahn.xpi

.PHONY: clean test-install all

all: $(XPI_NAME)

$(XPI_NAME):
	node build.js

clean:
	node -e "const fs=require('fs');fs.readdirSync('.').filter(f=>f.endsWith('.xpi')).forEach(f=>fs.unlinkSync(f))"

test-install: all
	node test-install.js
