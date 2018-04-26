TARGETS = \
	var/floorviz.ttl \


all: ${TARGETS}

clean:
	rm -Rf ${TARGETS}

mrproper: clean
	rm -Rf *~


var:
	mkdir var

var/floorviz.ttl: var src/generate-brick-extension
	./src/generate-brick-extension ../brick-data/src/brick-data.ttl  var/florviz.ttl

