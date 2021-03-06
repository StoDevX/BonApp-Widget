command: 'curl -s "http://legacy.cafebonappetit.com/api/2/menus?cafe=261"',
refreshFrequency: 300000,

render: function(output) {
  return [
      '<link rel="stylesheet" href="BonApp-Widget/styles/bonAppStyle.css">',
      '<link rel="stylesheet" href="BonApp-Widget/styles/jquery/jquery-ui.css">',
      '<script src="BonApp-Widget/scripts/jquery/jquery-ui.js.lib"></script>',

      '<div id="bonApp" class="noSelect">',
        //'<div id="noNetwork"><span>Could not update</span></div>',
        '<div id="topRightIcon"></div>',
        '<div id="cafeSelection">',
          '<div id="widgetSelectTitle" class="e"></div>',
          '<div id="queryWrapper">',
            '<div id="queryBox">',
              '<input type="text" class="queryBox" id="search" placeholder="Search...">',
            '</div>',
          '</div>',
          '<div id="spinner">',
            '<img id="spinnerImg" src="BonApp-Widget/img/spinner.gif"></img>',
          '</div>',
        '</div>',
        '<div id="main">',
          '<div id="widgetTitle" class="e"></div>',
          '<div id="date" class="e"></div>',
          '<div id="myDietWrapper" align="center">',
            '<select class="myDiet">',
              '<option value="-1">All</option>',
              '<option value="6">Farm to Fork</option>',
              '<option value="18">Humane</option>',
              '<option value="7">In-Balance</option>',
              '<option value="9">Made Without Gluten</option>',
              '<option value="57">Contains Nuts</option>',
              '<option value="3">Seafood Watch</option>',
              '<option value="1">Vegetarian</option>',
              '<option value="4">Vegan</option>',
            '</select>',
          '</div>',
          '<div id="food" class="e"></div>',
          '<div id="footerBA"></div>',
        '</div>',
      '</div>'
    ].join('')
  },

  update: function(output, domEl) {
    var theMenu = null

    var dietSelection = domEl.querySelector('.myDiet')


    var parseCafe = function(json) {
      var id = Object.keys(json['days'][0]['cafes'])[0]
      var theTitle = json['days'][0]['cafes'][id]['name']

      return theTitle
    }


    var parseDate = function(x) {
      var y = x.substr(0, 4)
      var m = x.substr(5, 2)
      var d = x.substr(8, 2)

      var postedDate = new Date(y, m - 1, d).toString()
      postedDate = postedDate.substr(0, 10)

      return postedDate
    }


    var widgetSelect = 'Find Your Café'
    var jstringObj   = JSON.parse(output)
    var theDate      = parseDate(jstringObj.days[0].date)
    var title        = parseCafe(jstringObj)

    var createOutputString = function(okItems) {
      return okItems.join('<br>')
    }


    var parseMenu = function(menu, diet) {
      var preferredDiet = parseInt(diet)
      var okItems = []
      var prevStation = ''
      var item = ''
      var desc = ''

      for (var prop in menu) {
        if (menu.hasOwnProperty(prop)) {
          if (menu[prop].cor_icon.hasOwnProperty(preferredDiet) || preferredDiet === -1) {
            if (menu[prop].station !== prevStation) {
              item = '<br />' + cleanUpStationLabel(menu[prop].station + '<br />')
              item += '⚬ ' + capitalizeStr(menu[prop].label, 0, 1)
              if(menu[prop].description != '') {
                  desc = menu[prop].description.replace(/<br \/>/g, '<br /> ⚬ ')
                  item += "<br />" + '⚬ ' + desc
              }
              prevStation = menu[prop].station
            }
            else {
              item = '⚬ ' + capitalizeStr(menu[prop].label, 0, 1)
              if(menu[prop].description != '') {
                  desc = menu[prop].description.replace(/<br \/>/g, '<br /> ⚬ ')
                  item += "<br />" + '⚬ ' + desc
              }
                prevStation = menu[prop].station
            }
            okItems.push(item)
          }
        }
      }
      if (okItems.length === 0) {
        okItems.push('0 menu items found...')
      }

      return okItems
    }


    var lastUpdated = function() {
      var time = new Date
      var hours = time.getHours()
      var minutes = time.getMinutes()
      var timeOfDay = ''

      if (hours > 12) {
        timeOfDay = 'pm'
        hours -= 12
      }
      else if (hours == 12) {
        timeOfDay = 'pm'
      }
      else if (hours === 0) {
        timeOfDay = 'am'
        hours = 12
      }
      else {
        timeOfDay = 'am'
      }

      return function() { return 'Updated at ' + pad(hours) + ':' + pad(minutes) + timeOfDay}
    }


    var pad = function(number) {
      return (number < 10 ? '0' : '') + number
    }


    var capitalizeStr = function(theStr, upperCaseLetter, removeLetter) {
      var newCapitalStr = theStr[upperCaseLetter].toUpperCase() + theStr.slice(removeLetter)
      return newCapitalStr
    }


    var sortByProperty = function(property) {
      //'use strict'
      return function(a, b) {
        var sortStatus = 0
        if (a[property] < b[property]) {
          sortStatus = -1
        }
        else if (a[property] > b[property]) {
          sortStatus = 1
        }

        return sortStatus
      }
    }

    const updateTheData = (cafeId) => {
      const cmd = `curl -s http://legacy.cafebonappetit.com/api/2/menus?cafe=${cafeId}`
      return this.run(cmd, (err, output) => {
        makeItAllHappen(output)
        return changeTheView()
      })
    }

    var initSearch = function() {
      return jQuery.get('BonApp-Widget/scripts/data.json', function(data) {
        return $('#search').autocomplete({
          source: data.sort(sortByProperty('label')),
          minLength: 2,

          select: function(event, ui) {
            $("#spinner").show()
            $('#search').val(ui.item.label)

            updateTheData(ui.item.id)

            return false
          },

          open: function() {
            return $('.ui-autocomplete:visible').css({
              top: '+=0',
              left: '-=0'
            })
          }

        }).autocomplete('instance')._renderItem = function(ul, item) {
          return $('<li>').append('<div>' +
                                  '<a id=\'search-label\'>' + item.label + '</a>' +
                                  '<a id=\'search-description\'>' + item.desc + '</a>' + '</div>')
                          .appendTo(ul)
        }
      })
    }


    var cleanUpStationLabel = function(theStation) {
      var cleanString = theStation.replace('@', '')
      var capitalizedStr = capitalizeStr(cleanString, 8, 9)
      capitalizedStr = '<strong>' + capitalizedStr + '</strong>'

      return capitalizedStr
    }


    var updateView = function(theDate, widgetSelect, title, outputString) {
      var theLastUpdate = lastUpdated

      try {
        $(domEl).find(widgetSelectTitle).html(widgetSelect)
        $(domEl).find(widgetTitle).html(title)
        $(domEl).find(date).html(theDate)
        $(domEl).find(footerBA).html(theLastUpdate)
        return $(domEl).find(food).html(outputString)
      }
      catch (_error) {
        console.log('Error: "' + _error.message + '" on line ' + _error.line)
      }
    }


    var initFromLocalStorage = function() {
      var theValue

      if (localStorage.getItem('BonAppSettings') !== null) {
        savedDiet = localStorage.getItem('BonAppSettings')
        theValue = JSON.parse(savedDiet).diet
        document.querySelector('.myDiet').value = theValue
      }
      else {
        return -1
      }

      return theValue
    }

    var switchNum = 0

    var changeTheView = function() {

      if (switchNum % 2 == 0) {
        $('#cafeSelection').show()
        $('#main').hide()
        $("#spinner").hide()
        $('#topRightIcon').css('background-image', 'url(BonApp-Widget/img/arrow.png)')
        $('#bonApp').css('height', '200px')
        $('.queryBox').focus()

        initSearch()
      }
      else {
        $('#cafeSelection').hide()
        $('#main').show()
        $('#topRightIcon').css('background-image', 'url(BonApp-Widget/img/search.png)')
        $('#bonApp').css('height', 'auto')
      }

      return switchNum++
    }


    document.getElementById('topRightIcon').addEventListener('click', function() {
      return changeTheView()
    })


   var makeItAllHappen = function(output) {
      var savedDiet    = initFromLocalStorage()
      var jstringObj   = JSON.parse(output)
      var title        = parseCafe(jstringObj)
      var theDate      = parseDate(jstringObj.days[0].date)
      var theMenu      = jstringObj.items
      var friendly     = parseMenu(theMenu, savedDiet)
      var outputString = createOutputString(friendly)
      var widgetSelect = 'Find Your Café'

      dietSelection.onchange = function() {
        return saveSettings(dietSelection.value)
      }

      var saveSettings = function(diet) {
        var userSettings = {
          diet: diet
        }

        localStorage.setItem('BonAppSettings', JSON.stringify(userSettings))
        var friendly = parseMenu(theMenu, diet)
        outputString = createOutputString(friendly)

        return updateView(theDate, widgetSelect, title, outputString)
    }


      return updateView(theDate, widgetSelect, title, outputString)
    }


    makeItAllHappen(output)
  }
