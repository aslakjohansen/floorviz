# FloorViz: a Floor Visualization Technology Demonstrator for Brick, HodDB and sMAP

## List of Demonstrations

- Modification of a displayed SVG object loaded from a file
- Javascript interaction with [HodDB](https://hoddb.org)
- The [building properties](https://github.com/aslakjohansen/brick-data) extension to [Brick](http://brickschema.org)
- Javascript interaction with the [republish interface](https://people.eecs.berkeley.edu/~stevedh/smap2/archiver.html#real-time-data-access) of a [sMAP-style archiver](https://github.com/SoftwareDefinedBuildings/smap/tree/unitoftime)

## User Workflow

1. Enter an URI for a HodDB installation exposing a model containing the required annotations. Press enter. This will bring up the schematics of the building, load a list of supported modalities and start data collection.
2. Choose a modality. Doing so will update the view into the collected data.

## Required Annotations

### Namespace

### SVG Annotations

- Link to SVG with floorplan
- Map from stream uuid to svg id

### Stream Annotations

- Map from some entity in a room to a stream (including all information to fetch it)

### Scale Annotations

- Map from some stream (see above) to a min and a max

## Future Work

- Support for aspects other than the spatial (floorplan). This includes the HVAC, district heating and lighting systems.

