var currentTrack = "", currentPos = 0, currentDuration = 0, currentPlaylist = "". currentVolume = 0, hideOverlay = null, view = 'list';

var getTime = function(pos) {
  
  if(typeof pos == 'undefined' || pos <= 0)
    return {'hours':0, 'minutes':0, 'seconds':0, 'position': 0};
  
  var minute; 
  var hour;
  var second;


  hour = Math.floor(pos/3600);
  
  if(pos%3600 != 0) {
    minute = Math.floor((pos - (hour * 3600))/60);
    if((pos-(hour*3600))%60 == 0)
      second = pos;
    else
      second = Math.floor((pos-(hour*3600))%60)
  }
  
  return {'hours':hour, 'minutes':minute, 'seconds':second, 'position': pos};
  
};

var getAllPlaylists = function() {
  $.get('cmd.php?q=all_playlists', function(all) {
    var playlists = all.split(";#;");
    var sidebar_width = $('.player .main .sidebar').outerWidth();
    var l = 1, scrollTo = 1;
    
    $.each(playlists, function(key, playlist) {
          
          var playlistLn = $('<li />').attr('title', playlist).attr('id', l++);
          
          playlistLn.addClass('playlist');
          
          if(playlist == currentPlaylist) {
            playlistLn.addClass('active-playlist');
            scrollTo = l;
          }
          
          playlistLn.data('playlist', playlist);
          
          if(playlist.length >= 35)
            var playlist = playlist.substr(0, 32) + '...';
          
          playlistLn.append('<span>' + playlist + '</span>');
          
      $('.player .main .sidebar ul').append(playlistLn);
    });
    
    $('.player .main .sidebar .playlist').click(function() {
      $.get('cmd.php?q=playtrack&p[]=1&p[]=' + encodeURI($(this).data('playlist')));
    });
    
    window.location = '#' + (scrollTo - 2);
    
  });
};

var setCoverView = function(tracks) {

  var i = 1;
  var _tracks = {};
  
  $.each(tracks, function(key, track) {
    var singleTrack = track.split("|");
    _tracks[singleTrack[2]] = singleTrack;
  });
  
  $.each(_tracks, function(album, track) {
  
    var trackBox = $('<div />');
    
    trackBox.addClass('artwork-box');
    
    trackBox.append('<img src="img.php?track=' + track[1] + '&list=' + track[3] +'" border="0" />');
    
    $('.player .main .tracklist table tbody').append(trackBox);
    
  });
  

};


var setListView = function(tracks) {
  
  var i = 1;
  
  $.each(tracks, function(key, track) {
        
    var singleTrack = track.split("|");
    var trackLn = $('<tr />');
    
    if(i%2 == 1)
      trackLn.addClass('odd');
    
    trackLn.addClass('track');
    
    if(singleTrack[1] == currentTrack[1])
      trackLn.addClass('active-track');
    
    trackLn.data('playlist', currentPlaylist);
    trackLn.data('track-no', i);
    
    trackLn.append('<td class="track-no">' + (i++) + '</td>');
    trackLn.append('<td class="track-name">' + singleTrack[1] + '</td>');
    trackLn.append('<td class="track-artist">' + singleTrack[0] + '</td>');
    trackLn.append('<td class="track-album">' + singleTrack[2] + '</td>');
    
    $('.player .main .tracklist table tbody').append(trackLn);
    
  });
  
  if($('.player .sidebar ul li.active-playlist').length > 0 && $('.player .sidebar ul li.active-playlist').attr('title') != currentPlaylist) {
    $('.player .sidebar ul li.active-playlist').removeClass('active-playlist');
    var scrollTo = $('.player .sidebar ul li[title="' + currentPlaylist + '"]').addClass('active-playlist').attr('id');
    window.location = '#' + (scrollTo - 1);
  }
  
  $('.player .main .tracklist .track').click(function() {
    $.get('cmd.php?q=playtrack&p[]=' + $(this).data('track-no') + '&p[]=' + encodeURI($(this).data('playlist')));
  });

};


var getPlaylist = function() {
  $.get('cmd.php?q=playlist', function(playlist) {
      
      playlist = playlist.substr(0, (playlist.length - 3));
        $('.player .main .tracklist table tbody').html("");
      
      var tracks = playlist.split(";#;");
      
      currentPlaylist = tracks[0].split("|");
      currentPlaylist = currentPlaylist[3];
      
      switch(view) {
        case 'cover':
          setCoverView(tracks);
          break;
        default:
          setListView(tracks);
          break;
      }
      
  });
};

var getTrackInfo = function() {
  $.get('cmd.php?q=info', function(track) {
      currentTrack = track.split('|');
      setTrackInfo();
  });
  $.get('cmd.php?q=duration', function(duration) {
      currentDuration = getTime(duration);
  });
};

var getCurrentPosition = function() {
  $.get('cmd.php?q=position', function(pos) {
      
      if(currentPos > pos) {
        getTrackInfo();
        getPlaylist();
      }
      
      currentPos = pos;
      currentTime = getTime(pos);
      
      setTrackPosition();
      
  });
};

var setTrackInfo = function() {
  
  if(currentTrack[0] == 'false') {
    $('.player .toolbar .info-window .window #artist-album').text('-');
    $('.player .toolbar .info-window .window #title').text('Player stopped!');
    $('.player .toolbar .circle-button#playpause').removeClass('pause-button').addClass('play-button');
    
  } else {
    
    $('.player .toolbar .info-window .window #artist-album').text(currentTrack[0] + ' - ' + currentTrack[2]);
    $('.player .toolbar .info-window .window #title').text(currentTrack[1]);
    
    switch(currentTrack[3]) {
      case 'play':
        $('.player .toolbar .circle-button#playpause').removeClass('play-button').addClass('pause-button');
        break;
      case 'stop':
      case 'pause':
        $('.player .toolbar .circle-button#playpause').removeClass('pause-button').addClass('play-button');
        break;
    }
          
  }
  
}

var setTrackPosition = function() {
  
  if(currentTime.position == 'missing value') {
    $('.player .toolbar .info-window .window #track-position').text('0:00');
  } else {
    $('.player .toolbar .info-window .window #track-position').text((currentTime.hours > 0 ? currentTime.hours + ':' : '') + currentTime.minutes + ':' + (currentTime.seconds < 10 ? '0' + currentTime.seconds : currentTime.seconds));
  }
          
  if(currentDuration.position == 'missing value') {
    $('.player .toolbar .info-window .window #track-duration').text('0:00');
    var progress = 0;
  } else {
    $('.player .toolbar .info-window .window #track-duration').text((currentDuration.hours > 0 ? currentDuration.hours + ':' : '') + currentDuration.minutes + ':' + (currentDuration.seconds < 10 ? '0' + currentDuration.seconds : currentDuration.seconds));
    var progress = Math.round(currentTime.position / currentDuration.position * 100);
  }
  
  $('.player .toolbar .info-window .window #track-bar div').width(progress + '%').data('position', (currentTime.position != 'missing value' ? currentTime.position : 0));
  $('.player .toolbar .info-window .window #track-bar').data('duration', (currentDuration.position != 'missing value' ? currentDuration.position : 0));
  
}

var setClickEvents = function() {
  
  $('.player .toolbar .circle-button#playpause').click(function() {
    if($(this).hasClass('play-button'))
      $('.player .toolbar .circle-button#playpause').removeClass('play-button').addClass('pause-button');
    else
      $('.player .toolbar .circle-button#playpause').removeClass('pause-button').addClass('play-button');
    $.get('cmd.php?q=playpause');
  });
  
  $('.player .toolbar .circle-button#prev').click(function() {
    $.get('cmd.php?q=prev');
  });
  
  $('.player .toolbar .circle-button#next').click(function() {
    $.get('cmd.php?q=next');
  });
  
  $('.player .toolbar #track-bar').click(function(e) {
      
      var pos = $(this).position();
      var duration = $('.player .toolbar .info-window .window #track-bar').data('duration');
      
      if(parseInt(duration) > 0) {
        
        var clicked_percent  = Math.floor((e.pageX-pos.left)*100/$(this).width());
        var clicked_position = Math.floor(duration/100*clicked_percent);
        
        $.get('cmd.php?q=set_position&p[]=' + clicked_position, function() {
            $('.player .toolbar .info-window .window #track-bar div').width(clicked_percent + '%')
        });
        
      }
      
  });
  
  $('.player .toolbar #mute-volume').click(function() {
      $.get('cmd.php?q=volume&p[]=0', function() {
        $( ".player .volume-bar" ).slider('value', 0);
      });
  });
  
  
  $('.player .toolbar #full-volume').click(function() {
      $.get('cmd.php?q=volume&p[]=100', function() {
        $( ".player .volume-bar" ).slider('value', 100);
      });
  });
  
  
};


var setKeyEvents = function() {
  
  $(document).keyup(function(e) {
      
      if(e.altKey) {
        
        switch(e.keyCode) {
          case 107:
          case 187:
            var vol = (currentVolume <= 90 ? (currentVolume + 10) : 100);
            $.get('cmd.php?q=volume&p[]=' + vol, function() {
              setVolumeOverlay(vol);
              $( ".player .volume-bar" ).slider('value', vol);
            });
            break;
          case 109:
          case 189:
            var vol = (currentVolume >= 10 ? (currentVolume - 10) : 0);
            $.get('cmd.php?q=volume&p[]=' + vol, function() {
              setVolumeOverlay(vol);
              $( ".player .volume-bar" ).slider('value', vol);
            });
            break;
          
        };
        
      }
      
  });
  
};

var getVolumeProgress = function() {
  
  $.get('cmd.php?q=volume', function(volume) {
    
    currentVolume = volume;
    
    $( ".player .volume-bar" ).slider({
        range: "min",
        value: volume,
        min: 1,
        max: 100,
        change: function( event, ui ) {
            setVolumeProgress(ui.value);
        }
    });
  
  });
  
};

var setVolumeProgress = function(volume) {
  $.get('cmd.php?q=volume&p[]=' + volume, function() {
      currentVolume = volume;
  });
};


var setVolumeOverlay = function(volume) {
  
  if(typeof volume == 'undefined')
    volume = 0;
  
  if($('.player .overlay').length > 0) {
    
    var overlay = $('.player .overlay');
    window.clearTimeout(hideOverlay);
    overlay.stop().fadeIn(0);;
    
    overlay.find('.volume-progress').css('width', volume + '%');
    
  } else {
    
    var overlay = $('<div class="overlay" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"></div>');
    
    overlay.append('<div style="width: 150px; height: 150px; position: absolute; top: 70%; left: 50%; margin-left: -75px; margin-top: -75px; opacity: 0.3; background-color: black; border-radius: 5px; z-index: 10;"></div>');
    var overlay_box = $('<div style="width: 120px; height: 120px; position: absolute; top: 70%; left: 50%; margin-left: -60px; margin-top: -60px; z-index: 20; text-align: center;"></div>');
    
    overlay_box.append('<img src="images/VolumeOverlay.png" border="0" />');
    overlay_box.append('<div class="volume-progress" style="background: transparent url(\'images/VolumePogressOverlay.png\') repeat-x left top; width: ' + volume + '%; height: 8px; position: absolute; bottom:  0px; z-index: 10;"></div>');
    overlay_box.append('<div class="volume-size"     style="background: transparent url(\'images/VolumePogressInactiveOverlay.png\') repeat-x left top; width: 100%; height: 8px; position: absolute; bottom: 0px; z-index: 5;"></div>');
    
    overlay.append(overlay_box);
    
    $('.player').prepend(overlay);
    
  }
  
  hideOverlay = window.setTimeout(function() {
    overlay.fadeOut('slow', function() {
        $(this).remove();
    });
  }, 1000);
  
};

$(document).ready(function() {

    getTrackInfo();
    getPlaylist();
    getAllPlaylists();
    
    setClickEvents();
    setKeyEvents();
    getVolumeProgress();
    
    window.setInterval(getTrackInfo, 5000);
    window.setInterval(getCurrentPosition, 1000);
    
    // Search
    //$('.player .searchbar form').submit(function() {
    //    $.get('cmd.php?q=search&p[]=' + $('.search', this).val(), function(data) {
    //        console.log(data);
    //    });
    //});
    
});
