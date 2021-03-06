import React, { Component } from 'react';
import *  as d3 from 'd3';
import { LabelValue } from '../../components';

// Both constants used for converting from METAR to readable text
const COVER_KEY = {
  "SKC": 0,
  "NCD": 0,
  "CLR": 0,
  "FEW": 1,
  "SCT": 2,
  "BKN": 3,
  "OVC": 4,
  "VV": 5
}

const COVER_TO_STRING = {
  "SKC": "Sky Clear",
  "FEW": "Few",
  "SCT": "Scattered",
  "BKN": "Broken",
  "OVC": "Overcast",
  "VV": "Variable",
  "CLR": "Clear",
}

class CloudLayerVis extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stringClouds: ""
    }
  }
  componentDidMount() {
    this.createGraph()
    // console.log("Metar Cloud Layer Vis Mounting")
  }

  UNSAFE_componentWillReceiveProps(props) {
    this.props = props;
    this.createGraph()
  }

  drawCloud = (svg, cloud, minX, maxX, yScale) => {
    var clouds; // [[startX, endX]]
    var xScale = d3.scaleLinear()
      .domain([0, 48])
      .range([minX, maxX])

    // Clouds are defined on a scale from 0 to 48
    // Each value in the list defines a cloud
    // Not included values are blank
    // Hard coded cloud cover cloud amounts
    if (cloud.cover === 0) {
      return;
    } else if (cloud.cover === 1) {
      clouds = [
        [5, 20], [28, 43]
      ]
    } else if (cloud.cover === 2) {
      clouds = [
        [2, 14], [18, 30], [34, 46]
      ]
    } else if (cloud.cover === 3) {
      clouds = [
        [1, 11], [13, 22], [25, 35], [37, 47]
      ]
    } else if (cloud.cover === 4) {
      clouds = [
        [0, 9.6], [9.6, 19.2], [19.2, 28.8], [28.8, 38.4], [38.4, 48]
      ]
    } else if (cloud.cover === 5) {
      clouds = [
        [0, 48]
      ]
    }



    // Clouds
    svg.selectAll('clouds' + cloud.alt)
      .data(clouds)
      .enter()
      .append('rect')
      .attr('x', d => xScale(d[0]))
      .attr('y', yScale(cloud.alt) - (yScale(0) - yScale(1000)))
      .attr('width', d => {
        return xScale(d[1]) - xScale(d[0])
      })
      .attr('height', (yScale(0) - yScale(1500)))
      .attr('fill', '#AAAAAA')
      .attr('rx', 10)
      .attr('ry', 10)

    // Labels
    svg.append('text')
      .attr('x', 5)
      .attr('y', yScale(+cloud.alt + 500))
      .text(COVER_TO_STRING[cloud.actual] + " " + (cloud.alt + "ft"))
      .attr('color', 'black')
      .attr('text-anchor', 'start')


  }

  // Pads numbers to look more like original METAR
  pad = (num, size) => {
    var s = "000000000" + num;
    return s.substr(s.length - size);
  }

  createGraph = () => {
    // Runs everytime visual changes
    const node = this.node;
    var svg = d3.select(node);
    svg.selectAll('*').remove();

    if (!this.props.metar) {
      return;
    } else {
      var metar = this.props.metar;
    }

    var width = this.props.width || 500;
    var height = this.props.height || 800;

    var MAX_ALT = 30000;
    var yScale = d3.scaleLinear()
      .domain([0, MAX_ALT])
      .range([height * 0.95, height * 0.05])


    // Draws only label for 30k ft
    svg.selectAll('label')
      .data([30000])
      .enter()
      .append('text')
      .attr('text-anchor', 'end')
      .attr('x', d => 95)
      .attr('y', d => yScale(d) - 2)
      .text((d, i) => {
        if (i === 0) {
          return d + 'ft AGL';
        } else {
          return d + 'ft';
        }
      })

    // Draws only label tick for 30kft
    svg.selectAll("labelTicks")
      .data([30000])//)d3.range(0, MAX_ALT + 1, 3000))
      .enter()
      .append('line')
      .attr('x1', 140)
      .attr('y1', d => yScale(d))
      .attr('x2', 100)
      .attr('y2', d => yScale(d))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)


    // Left Side edge Vertical Line
    svg.append('line')
      .attr('x1', 140)
      .attr('y1', yScale(MAX_ALT) - 10)
      .attr('x2', 140)
      .attr('y2', yScale(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)

    // Bottom edge Horizontal Line
    svg.append('line')
      .attr('x1', 140)
      .attr('y1', yScale(0))
      .attr('x2', width)
      .attr('y2', yScale(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)


    // For each level we want the cloud level
    // Important columns: skyc1,skyc2,skyc3,skyc4,skyl1,skyl2,skyl3,skyl4
    // Potential data
    var levels = [
      // {
      //   alt: Number,
      //   cover: Number
      // }
    ]
    let stringClouds = "";
    for (let i = 0; i < metar.clouds.length; i++) {
      if (!COVER_KEY[metar.clouds[i].cover]) {
        if (metar.clouds[i].cover === 'CLR' || metar.clouds[i].cover === 'SKC') {
          stringClouds += metar.clouds[i].cover
        }
        continue;
      }


        // Format string to display above graphic
        stringClouds += metar.clouds[i].cover + this.pad((+metar.clouds[i].base) / 100, 3) + ' '


        // Push data onto levels to be fed into draw cloud
        levels.push({
          alt: metar.clouds[i].base,
          cover: COVER_KEY[metar.clouds[i].cover],
          actual: metar.clouds[i].cover
        })
      }

      levels.forEach(cloud => {

        this.drawCloud(
          svg, cloud, 140, width, yScale
        )
      })

      this.setState({
        stringClouds: stringClouds
      })

    }

    render() {
      var { width, height } = this.props;
      return (
        <div style={{ textAlign: 'start' }}>
          <LabelValue className='selectable metarclouds' label={"Clouds"} value={this.state.stringClouds ? this.state.stringClouds : ""} />
          <svg ref={node => this.node = node} width={width || 500} height={height || 500}>
          </svg>
        </div>
      );
    }
  }

  export default CloudLayerVis;
