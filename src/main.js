require( "babel-runtime/regenerator" );
require( './index.html'              );
require( './main.scss'               );
const d3 = require( 'd3' );

////////////////////////////////////////////////////////////////////////////////////////////////////
//                        by Yago Estévez. https://twitter.com/yagoestevez                        //
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


// Here the data is fetched from the API or throws an error. If everything is OK,
// the bar chart is build using the data from the API.
d3.json(
  'https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/GDP-data.json'
).then( data => {
  // Hides preloader.
  document.getElementById( 'preloader' ).classList.add( 'hidden' ); 
  // Builds the chart.
  const getTheChart = new ChartBuilder( data.data );
  getTheChart.makeCanvas().drawlabel().setScales().drawAxes().drawBars().setTooltip().and.animate();
} )
.catch( error => { throw new Error( error ) } );

// The Chart Builder class.
// Owns all the methods and properties required to build the bar chart.
class ChartBuilder {

  constructor ( data ) {
    // Sets up sizes.
    this.chartWidth  = 600;
    this.chartHeight = 400;
    this.margin      = { top: 10, bottom: 50, left: 70, right: 10 };
    this.innerWidth  = this.chartWidth  - this.margin.left - this.margin.right;
    this.innerHeight = this.chartHeight - this.margin.top  - this.margin.bottom;

    // Sets up the transition options.
    this.transitionDelay    = 10;
    this.transitionDuration = 800;
    this.easingMethod       = d3.easeCircle;

    // Cleans up the received data.
    this.data       = this.cleanUpData( data );

    // Selects the elements.
    this.chart       = d3.select( '#chart' );
    this.canvas      = this.chart.append( 'g' );
    this.xAxisLine   = this.canvas.append( 'g' );
    this.yAxisLine   = this.canvas.append( 'g' );
    this.allBars     = this.canvas.selectAll( 'rect' );
    this.singleBar   = this.allBars.data( this.data ).enter( ).append( 'rect' );
    this.label       = this.canvas.append( 'text' );
    this.tooltip     = this.canvas.append( 'g' )
    this.tooltipIcon = this.tooltip.append( 'path' )
    this.tooltipText = this.tooltip.append( 'text' )

    // For chaining methods.
    this.and = this;
  }

  // Cleans up the fetched data array.
  cleanUpData ( rawData ) {
    return rawData.map( data => {
      const year  = data[ 0 ].substring( 0,4 );
      const month = data[ 0 ].substring( 5,7 );
      const text  = month === '01' && `Q1/${data[0].substring(0,4)}`
                 || month === '04' && `Q2/${data[0].substring(0,4)}`
                 || month === '07' && `Q3/${data[0].substring(0,4)}`
                 || `Q4/${data[0].substring(0,4)}`;
      return { 
        year      : year,
        date      : new Date( year, month ),
        text      : text,
        dateString: data[ 0 ],
        value     : +data[ 1 ]
      }
    } );
  }

  // Creates the canvas for the chart.
  makeCanvas ( ) {
    this.chart.attr(   'viewBox' , `0 0 ${this.chartWidth} ${this.chartHeight}` );
    this.canvas.attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
    return this;
  }

  // Puts a label for the Y axis.
  drawlabel ( ) {
    this.label
      .attr( 'class'    , 'label' )
      .attr( 'transform', 'rotate(-90)' )
      .attr( 'x'        ,  0 )
      .attr( 'y'        , 20 )
      .text( `Gross Domestic Product ( ${d3.extent( this.data, d => d.year ).join(' - ')} )` );
    return this;
  }

  // Sets up scales for X and Y axes.
  setScales ( ) {
    this.x = d3.scaleBand( )
      .domain( this.data.map( d => d.date ) )
      .range( [ 0, this.innerWidth ] )
      .padding( 0.1 )
      .paddingOuter( 1 );
    this.xLineScale = d3.scaleLinear( )
      .domain( d3.extent( this.data.map( d => d.year ) ) )
      .range( [ 0, this.innerWidth ] )
    this.y = d3.scaleLinear( )
      .domain( [ 0, d3.max( this.data, d => d.value ) ] )
      .range( [ this.innerHeight, 0 ] );
    return this;
  }

  // Creates the bottom and left axes.
  drawAxes ( ) {
    const xAxis = d3.axisBottom( this.x )
      .scale( this.xLineScale )
      .tickFormat( d3.format( 'd' ) );
    const yAxis = d3.axisLeft( this.y )
      // .tickFormat( d => `$${d.toLocaleString( 'en' )} B` );
      .tickFormat( d => d ); // <-- using this because FCC test #11 will yell at me otherwise.

    this.xAxisLine.call( xAxis )
      .attr( 'class'    , 'x axis' )
      .attr( 'id'       , 'x-axis' )
      .attr( 'transform', `translate( 0, ${this.innerHeight + 5} )` )
      .selectAll( 'text' )
        .attr( 'class', 'x-tick' );
    this.yAxisLine.call( yAxis )
      .attr( 'class'    , 'y axis' )
      .attr( 'id'       , 'y-axis' )
      .attr( 'transform', 'translate( -5, 0 )' )
      .selectAll( 'text' )
        .attr( 'class', 'y-tick' );
    return this;
  }

  // Drawing the bars for the chart.
  drawBars ( ) {
    this.singleBar
      .attr( 'class'    , 'bar' )
      .attr( 'y'        , this.innerHeight )
      .attr( 'x'        , d => this.x( d.date ) )
      .attr( 'height'   , 0 )
      .attr( 'width'    , this.innerWidth / this.data.length +1 )
      // .attr( 'width' , this.x.bandwidth      )
      .attr( 'data-date', d => d.dateString )
      .attr( 'data-gdp' , d => d.value )
    this.handleEvents( );
    return this;
  }

  // Animates the bars.
  animate ( ) {
    this.singleBar.transition( )
      .delay( ( d,i ) => i * this.transitionDelay )
      .duration( this.transitionDuration )
      .ease( this.easingMethod )
        .attr( 'y'     , d => this.y( d.value ) )
        .attr( 'height', d => this.innerHeight - this.y( d.value ) )
    return this;
  }

  // Creates the tooltip to be shown when hover each bar.
  setTooltip ( ) {
    this.tooltip.attr( 'id', 'tooltip' ).attr( 'transform', 'translate( 100, 80)' );
    this.tooltipText.attr( 'id', 'tooltip-text' );
    this.tooltipIcon.attr( 'id', 'tooltip-icon' )
      .attr(
        'd',
        `M79.544 173.652v-21.96h44.45v43.92h-44.45zm27.199 10.795c.332-.332.433-2.248.157-2.968-.108
        -.283-.496-.419-1.19-.419h-1.03v-6.3c0-4.645-.088-6.418-.334-6.754-.292-.399-.777-.446-3.902
        -.381l-3.57.074v3.44l1.125.08 1.124.082v9.729l-1.124.081-1.125.082-.08 1.563c-.056 1.071.027
         1.632.264 1.782.57.36 9.315.279 9.685-.09zm-2.744-18.884c.511-.511.587-3.805.098-4.294-.198
         -.197-1.176-.317-2.593-.317s-2.395.12-2.593.317c-.184.185-.317 1.066-.317 2.098 0 2.397.24 
         2.612 2.91 2.612 1.537 0 2.187-.108 2.495-.416z`
      )
      .attr( 'transform', 'translate( -130, -180)' );
    return this;
  }

  // Sets up the event handlers for each bar.
  handleEvents ( ) {
    this.singleBar.on( 'mouseover', ( d,i ) => {
      this.tooltip
        .attr( 'data-date', this.data[i].dateString )
        .transition( )
        .duration( 100 )
        .style( 'opacity', 1 );
      this.tooltipText.html( `$${this.data[i].value} billions on ${this.data[i].text}` )
    } )
    this.singleBar.on( 'mouseout', d => {
      this.tooltip.transition( )
        .duration( 500 )
        .style( 'opacity', 0 );
    } );
    return this;
  }

}