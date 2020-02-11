import React from 'react'
import axios from 'axios';
import { withCookies, Cookies } from 'react-cookie';

import { LabelValue, SearchBox } from '../components';
import WindMetar from './WindMetar';


class Crosswind extends React.Component {
    constructor(props) {
        super(props)
        const { cookies } = props;

        this.state = {
            metar: null,
            airport: cookies.get('airport') || "KBED",
            nearestAirports: null,
            isMobile: false,
            runways: null,
            drct: 200,
            knts: 10,
            gust: 15
        }
    }

    handleWindowResize = () => {
        this.setState({ isMobile: window.innerWidth < 715 });
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleWindowResize);
        this.handleWindowResize()
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
    }

    UNSAFE_componentWillMount() {
        this.onSearch(this.state.airport);
    }

    onSearch = (ident) => {
        axios.get(`api/nearestAirports/${ident}`)
            .then(result => {
                this.setState({
                    nearestAirports: result.data
                })
            }).catch(error => {
                console.error(error);

            })
        axios.get(`/api/recentMETARs/${ident}`)
            .then(result => {
                this.setState({
                    metar: result.data.metars,
                    airport: ident,
                    runways: result.data.runways,
                    metarErrorMessage: ''
                })
            }).catch(error => {
                console.log(error);
                console.log("Metar Failed");
                this.setState({
                    metar: null,
                    metarErrorMessage: "Could not find airport. Try again"
                })
            })
    }

    handleDrag = (drct, spd) => {
        console.log(drct, spd);
        if (isNaN(drct) || isNaN(spd)) {
            return;
        }
        this.setState({
            metar: [{
                sknt: spd,
                drct: drct ,
                gust: 0
            }]
        })
    }

    render() {
        let { airport, metar, drct, knts, gust, runways, nearestAirports, isMobile } = this.state;
        return (
            <div>
                <SearchBox onClick={this.onSearch} value={airport} nearestAirports={nearestAirports} />
                <LabelValue label="Airport" value={airport} />
                {metar ?
                    <WindMetar
                        onDrag={this.handleDrag}
                        airport={airport}
                        runways={runways}
                        metar={metar}
                        width={isMobile ? 350 : 500}
                        height={isMobile ? 350 : 500} /> : null
                }

            </div >
        )
    }

}

export default withCookies(Crosswind);

