
  // Original JavaScript code by Chirp Internet: www.chirpinternet.eu
  // Please acknowledge use of this code by including this header.
  var cssIdx;
  var isFireWorksRunning=0; 
  function startFireWorks() {
    if (!isFireWorksRunning){
      isFireWorksRunning =1;
      var num_launchers = 12;
      var num_flares = 20;
      var flare_colours = ['red', 'aqua', 'violet', 'yellow', 'lightgreen', 'white', 'blue'];
      cssIdx ??= document.styleSheets.length - 1;
      
      function myRandom(from, to)
      {
        return from + Math.floor(Math.random() * (to-from));
      }
      
      var keyframes_template = "from { left: LEFTFROM%; top: 75vh; width: 6px; height: 12px; }\n"
      + "33% { left: LEFTTOP%; top: TOPTOPvh; width: 0; height: 0; }\n"
      + " to { left: LEFTEND%; top: BOTBOTvh; width: 0; height: 0; }";
      
      for(var i=0; i < num_launchers; i++) {
        leftfrom = myRandom(40, 60);
        lefttop = myRandom(20, 60);
        toptop = myRandom(5, 40);
        leftend = lefttop + (lefttop-leftfrom)/2;
        botbot = toptop + 26;
        
        csscode = keyframes_template;
        csscode = csscode.replace(/LEFTFROM/, leftfrom);
        csscode = csscode.replace(/LEFTTOP/, lefttop);
        csscode = csscode.replace(/TOPTOP/, toptop);
        csscode = csscode.replace(/LEFTEND/, leftend);
        csscode = csscode.replace(/BOTBOT/, botbot);
        
        try { // WebKit browsers
          csscode2 = "@-webkit-keyframes flight_" + i + " {\n" + csscode + "\n}";
          document.styleSheets[cssIdx].insertRule(csscode2, 0);
        } catch(e) { }
        
        try { // Mozilla browsers
          csscode2 = "@-moz-keyframes flight_" + i + " {\n" + csscode + "\n}";
          document.styleSheets[cssIdx].insertRule(csscode2, 0);
        } catch(e) { }
      }
      
      for(var i=0; i < num_launchers; i++) {
        var rand = myRandom(0, flare_colours.length - 1);
        var rand_colour = flare_colours[rand];
        var launch_delay = myRandom(0,100) / 10;
        
        csscode = ".launcher:nth-child(" + num_launchers + "n+" + i + ") {\n"
        + "  -webkit-animation-name: flight_" + i + ";\n"
        + "  -webkit-animation-delay: " + launch_delay + "s;\n"
        + "  -moz-animation-name: flight_" + i + ";\n"
        + "  -moz-animation-delay: " + launch_delay + "s;\n"
          + "}";
          document.styleSheets[cssIdx].insertRule(csscode, 0);
          
          csscode = ".launcher:nth-child(" + num_launchers + "n+" + i + ") div {"
          + "  border-color: " + rand_colour + ";\n"
          + "  -webkit-animation-delay: " + launch_delay + "s;\n"
          + "  -moz-animation-delay: " + launch_delay + "s;\n"
          + "}";
          document.styleSheets[cssIdx].insertRule(csscode, 0);
        }
        
        for(var i=0; i < num_flares; i++) {
          csscode = ".launcher div:nth-child(" + num_flares + "n+" + i + ") {\n"
          + "  -webkit-transform: rotate(" + (i * 360/num_flares) + "deg);\n"
          + "  -moz-transform: rotate(" + (i * 360/num_flares) + "deg);\n"
          + "}";
          document.styleSheets[cssIdx].insertRule(csscode, 0);
        }
        
        for(var i=0; i < num_launchers; i++) {
          var newdiv = document.createElement("div");
          newdiv.className = "launcher";
          for(var j=0; j < num_flares; j++) {
            newdiv.appendChild(document.createElement("div"));
          }
          document.getElementById("stage").appendChild(newdiv);
        }
      }
    }
    
    function stopFireworks(){
      isFireWorksRunning =0;
      document.getElementById("stage").innerHTML="";
      var sheet = document.styleSheets[cssIdx];
      if (cssIdx && sheet.cssRules) { 
        var re = new RegExp("launcher:|flight");
        var ee=sheet.cssRules.length-1;
        for (var i=ee; i>=0; i--) {
        if (sheet.cssRules[i] ) {
          if (re.test(sheet.cssRules[i].selectorText) || re.test(sheet.cssRules[i].name)) {        
              sheet.deleteRule (i);
            }
          }
        }  
      } 
    }