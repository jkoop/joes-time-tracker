const {ipcRenderer} = require('electron');
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const daysOfWeek = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const colours = [
    'red',
    'yellow',
    'green',
    'cyan',
    'blue',
    'magenta',
    'red-light',
    'yellow-light',
    'green-light',
    'cyan-light',
    'blue-light',
    'magenta-light',
    'red-dark',
    'yellow-dark',
    'green-dark',
    'cyan-dark',
    'blue-dark',
    'magenta-dark',
    'grey',
    'black',
];

let $ = require('jquery');
let fs = require('fs');
let sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('db.sqlite');

db.exec(`PRAGMA foreign_keys = ON; PRAGMA synchronous = OFF;`, refreshProjectsPage);

$('body > button').on('click', function(){tab(this);});

function refreshProjectsPage(){
    db.get('SELECT count(projectId) AS count FROM project WHERE isTrashed=0', function(err, row){
        ipcRenderer.send('setMSize', {
            width: 300,
            height: row.count * 28 + 100,
            minHeight: 300
        });
    });

    $('#page-projects').empty();
    db.each('SELECT * FROM project WHERE isTrashed=0', function(err, row){
        $('#page-projects')
            .append('<img src="./icons/clock-' + row.colour + '.png" project-id="' + row.projectId + '"/>')
            .append('<input class="project-name" project-id="' + row.projectId + '" placeholder="project name"/>');
        $('#page-projects input:last').val(row.name);
        $('#page-projects').append('<button class="project-start" project-id="' + row.projectId + '">&#x25BA;</button>');
    }, function(rowCount){
        addEmptyProjectToBottomOfProjectsPage();

        $('#page-projects input').on('change', function(){updateProject(this);});
        $('#page-projects button').on('click', function(){projectChangeTo(this);});

        refreshProjectButtons();
    });
}

function addEmptyProjectToBottomOfProjectsPage(){
    let usedColours = [];

    db.each('SELECT * FROM project WHERE isTrashed=0', function(err, row){
        usedColours.push(row.colour);
    }, function(err, rowCount){
        let nextColour = 'black';

        for(i in colours){
            if(!usedColours.includes(colours[i])){
                nextColour = colours[i];
                break;
            }
        }

        $('#page-projects').append('<img src="./icons/clock-' + nextColour + '.png" project-id="new"/>');
        $('#page-projects').append('<input class="project-name" project-id="new" placeholder="project name" autofocus/>');
        $('#page-projects').append('<button project-id="new" disabled>&#x25BA;</button>');

        $('#page-projects input[project-id="new"]').off('change').on('change', function(){updateProject(this);});
    });
}

function projectChangeTo(button = null){
    console.log('projectChangeTo()', button);

    db.run('UPDATE event SET stopTime=$stopTime WHERE stopTime IS NULL', {
        $stopTime: (new Date).getTime(),
    }, function(err){
        if(err == null){
            if(button == null){
                refreshProjectButtons();
            }else{
                db.run(`INSERT INTO event (projectId, startTime) VALUES ($projectId, $startTime)`, {
                    $startTime: (new Date).getTime(),
                    $projectId: $(button).attr('project-id'),
                }, function(err){
                    if(err == null){
                        refreshProjectButtons();
                    }else{
                        console.error(err);
                    }
                });
            }
        }else{
            console.error(err);
        }
    });
}

function refreshProjectButtons(){
    $('#page-projects button').each(function(){
        $(this).removeClass('active').html('&#x25BA;').off('click').on('click', function(){projectChangeTo(this);});
    });

    db.get('SELECT projectId FROM event WHERE stopTime IS NULL', function(err, row){
        if(typeof row != 'undefined'){
            $('#page-projects button[project-id=' + row.projectId + ']').addClass('active').html('&#x25A0;').off('click').on('click', function(){projectChangeTo();});
        }
    })
}

function updateProject(input){
    console.log(input);

    let projectId = $(input).attr('project-id');
    let name = $(input).val().trim();

    if(projectId == 'new'){
        if(name != ''){
            let usedColours = [];

            db.each('SELECT * FROM project WHERE isTrashed=0', function(err, row){
                usedColours.push(row.colour);
            }, function(err, rowCount){
                let nextColour = 'black';

                for(i in colours){
                    if(!usedColours.includes(colours[i])){
                        nextColour = colours[i];
                        break;
                    }
                }

                db.run('INSERT INTO project (projectId, colour, name) VALUES ($projectId, $colour, $name)', {
                    $colour: nextColour,
                    $name: name,
                }, function(err){
                    if(err == null){
                        db.get('SELECT * FROM project WHERE isTrashed=0 ORDER BY projectId DESC LIMIT 1', function(err, row){
                            $('#page-projects *[project-id="new"]')
                                .attr('disabled', false)
                                .attr('project-id', row.projectId);
                            addEmptyProjectToBottomOfProjectsPage();
                        });
                    }else{
                        console.error(err);
                    }
                });
            });
        }
    }else{
        if(name == ''){
            db.run('UPDATE project SET isTrashed=1 WHERE projectId=$projectId', {
                $projectId: projectId,
            }, function(err){
                if(err == null){
                    $('#page-projects *[project-id='+projectId+']').remove();
                    projectChangeTo();
                }else{
                    console.error(err);
                }
            });
        }else{
            db.run('UPDATE project SET name=$name WHERE projectId=$projectId', {
                $projectId: projectId,
                $name: name,
            }, function(err){
                if(err != null){
                    console.error(err);
                }
            });
        }
    }
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function refreshReportsPage(){
    $('#page-reports').html(`
        <div id="reports-range-display">
            <button disabled>&#x2190; Prev</button>
            <button disabled>&#x2191; Zoom<br>Out</button>
            <span class="th" id="reports-range-display-from"><div></div><div></div></span>
            <span class="th">to</span>
            <span class="th" id="reports-range-display-to"><div></div><div></div></span>
            <button disabled>Zoom<br/>In &#x2193;</button>
            <button disabled>Next &#x2192;</button>
        </div>
        <span><!-- icon spacer --></span>
        <span class="th left">Project</span>`);

    var now = new Date();
    var startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    var stopTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7);
    var stoptTime = new Date(stopTime.getTime() - 1000);

    $('#reports-range-display-from div:first').text(
        startTime.getFullYear()+' '+
        months[startTime.getMonth()]+' '+
        startTime.getDate().pad(2)
    );
    $('#reports-range-display-from div:last').text(
        startTime.getHours().pad(2)+':'+
        startTime.getMinutes().pad(2)+':'+
        startTime.getSeconds().pad(2)
    );

    $('#reports-range-display-to div:first').text(
        stoptTime.getFullYear()+' '+
        months[stoptTime.getMonth()]+' '+
        stoptTime.getDate().pad(2)
    );
    $('#reports-range-display-to div:last').text(
        stoptTime.getHours().pad(2)+':'+
        stoptTime.getMinutes().pad(2)+':'+
        stoptTime.getSeconds().pad(2)+'+1'
    );

    let a = new Date(startTime.getTime());
    for(let i=0; i<7; i++){
        $('#page-reports').append(
            '<span class="th">' +
            daysOfWeek[i] +
            '<br/>' +
            months[a.getMonth()]+' '+
            a.getDate()
        );
        a.setDate(a.getDate()+1);
    }

    startTime = startTime.getTime();
    stopTime = stopTime.getTime();

    $('#page-reports').append('<span class="th">Total');

    db.all(
        'SELECT * FROM project WHERE projectId IN (SELECT DISTINCT projectId FROM event WHERE (startTime>=$startTime AND startTime<$stopTime AND (stopTime<=$stopTime OR stopTime IS NULL)) OR (startTime<$startTime AND stopTime>$startTime) OR (startTime<$stopTime AND stopTime>$stopTime) ORDER BY projectId)', {
            $startTime: startTime,
            $stopTime: stopTime,
        }, function(err, rows){
            ipcRenderer.send('setMSize', {
                width: 600,
                height: rows.length * 28 + 165,
                minHeight: 300
            });

            rows.forEach(function(row,i){
                $('#page-reports')
                    .append('<img src="./icons/clock-' + row.colour + '.png" project-id="' + row.projectId + '"/>')
                    .append('<span class="project-name left" project-id="' + row.projectId + '"></span>');
                $('#page-reports span:last').text(row.name);

                for(let i=0; i<7; i++){
                    $('#page-reports').append('<span project-id="' + row.projectId + '" column="' + i + '">');

                    let startTimeL = startTime + i * (1000*60*60*24);
                    let stopTimeL = startTimeL + 1000*60*60*24;

                    db.all('SELECT startTime, stopTime FROM event WHERE projectId=$projectId AND (startTime>=$startTime AND startTime<$stopTime AND (stopTime<=$stopTime OR stopTime IS NULL)) OR (startTime<$startTime AND stopTime>$startTime) OR (startTime<$stopTime AND stopTime>$stopTime)', {
                        $projectId: row.projectId,
                        $startTime: startTimeL,
                        $stopTime: stopTimeL,
                    }, function(err, rows){
                        let sum = 0;

                        rows.forEach(function(row){
                            let duration = Math.min(stopTimeL, row.stopTime ?? now.getTime()) - Math.max(startTimeL, row.startTime);
                            sum += duration;
                        });

                        sum = Math.round(sum / 1000);

                        $('#page-reports span[project-id="'+row.projectId+'"][column="'+i+'"]').text(
                            Math.floor(sum / 3600).pad(2) + ':' +
                            Math.floor((sum % 3600) / 60).pad(2) + ':' +
                            (sum % 60).pad(2)
                        );
                    });
                }

                $('#page-reports').append('<span class="th" project-id="' + row.projectId + '" column="total">');

                db.all('SELECT startTime, stopTime FROM event WHERE projectId=$projectId AND (startTime>=$startTime AND startTime<$stopTime AND (stopTime<=$stopTime OR stopTime IS NULL)) OR (startTime<$startTime AND stopTime>$startTime) OR (startTime<$stopTime AND stopTime>$stopTime)', {
                    $projectId: row.projectId,
                    $startTime: startTime,
                    $stopTime: stopTime,
                }, function(err, rows){
                    let sum = 0;

                    rows.forEach(function(row){
                        let duration = Math.min(stopTime, row.stopTime ?? now.getTime()) - Math.max(startTime, row.startTime);
                        sum += duration;
                    });

                    sum = Math.round(sum / 1000);

                    $('#page-reports span[project-id="'+row.projectId+'"][column="total"]').text(
                        Math.floor(sum / 3600).pad(2) + ':' +
                        Math.floor((sum % 3600) / 60).pad(2) + ':' +
                        (sum % 60).pad(2)
                    );
                });

                if(row.isTrashed){
                    $('#page-reports [project-id="'+row.projectId+'"]').addClass('is-trashed');
                }
            });

            $('#page-reports')
                .append('<span class="img"></span>')
                .append('<span class="th left" project-id="total">Total</span>');

            for(let i=0; i<7; i++){
                $('#page-reports').append('<span project-id="total"" column="' + i + '">');

                let startTimeL = startTime + i * (1000*60*60*24);
                let stopTimeL = startTimeL + 1000*60*60*24;

                db.all('SELECT startTime, stopTime FROM event WHERE (startTime>=$startTime AND startTime<$stopTime AND (stopTime<=$stopTime OR stopTime IS NULL)) OR (startTime<$startTime AND stopTime>$startTime) OR (startTime<$stopTime AND stopTime>$stopTime)', {
                    $startTime: startTimeL,
                    $stopTime: stopTimeL,
                }, function(err, rows){
                    let sum = 0;

                    rows.forEach(function(row){
                        let duration = Math.min(stopTimeL, row.stopTime ?? now.getTime()) - Math.max(startTimeL, row.startTime);
                        sum += duration;
                    });

                    sum = Math.round(sum / 1000);

                    $('#page-reports span[project-id="total"][column="'+i+'"]').text(
                        Math.floor(sum / 3600).pad(2) + ':' +
                        Math.floor((sum % 3600) / 60).pad(2) + ':' +
                        (sum % 60).pad(2)
                    );
                });
            }

            $('#page-reports').append('<span class="th" project-id="total" column="total">');

            db.all('SELECT startTime, stopTime FROM event WHERE (startTime>=$startTime AND startTime<$stopTime AND (stopTime<=$stopTime OR stopTime IS NULL)) OR (startTime<$startTime AND stopTime>$startTime) OR (startTime<$stopTime AND stopTime>$stopTime)', {
                $startTime: startTime,
                $stopTime: stopTime,
            }, function(err, rows){
                let sum = 0;

                rows.forEach(function(row){
                    let duration = Math.min(stopTime, row.stopTime ?? now.getTime()) - Math.max(startTime, row.startTime);
                    sum += duration;
                });

                sum = Math.round(sum / 1000);

                $('#page-reports span[project-id="total"][column="total"]').text(
                    Math.floor(sum / 3600).pad(2) + ':' +
                    Math.floor((sum % 3600) / 60).pad(2) + ':' +
                    (sum % 60).pad(2)
                );
            });
        }
    );
}

function tab(name){
    name = $(name).attr('name');

    $('body > button').removeClass('active');
    $('#tab-' + name).addClass('active');

    $('body > div').hide();
    $('#page-' + name).css('display', 'grid');

    if(name == 'projects'){
        refreshProjectsPage();
    }else if(name == 'reports'){
        refreshReportsPage();
    }
}
