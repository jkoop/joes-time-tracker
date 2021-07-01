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

db.exec(`CREATE TABLE IF NOT EXISTS project (
    projectId INTEGER PRIMARY KEY AUTOINCREMENT,
    colour TEXT NOT NULL,
    name TEXT NOT NULL,
    isTrashed INTEGER NOT NULL DEFAULT 0
);CREATE TABLE IF NOT EXISTS event (
    projectId INTEGER NOT NULL,
    startTime INTEGER NOT NULL,
    stopTime INTEGER
)`, function(){
    refreshProjectNames();
});

$('body > button').on('click', function(){tab(this);});

function refreshProjectNames(){
    $('#page-projects').empty();
    db.each('SELECT * FROM project WHERE isTrashed=0', function(err, row){
        $('#page-projects')
            .append('<img src="./icons/clock-' + row.colour + '.png" project-id="' + row.projectId + '"/>')
            .append('<input class="project-name" project-id="' + row.projectId + '" placeholder="project name"/>');
        $('#page-projects input:last').val(row.name);
        $('#page-projects').append('<button class="project-start" project-id="' + row.projectId + '">&#x25BA;</button>');

        $('#page-reports')
            .append('<img src="./icons/clock-' + row.colour + '.png" project-id="' + row.projectId + '"/>')
            .append('<span class="project-name" project-id="' + row.projectId + '"></span>');
        $('#page-reports span:last').text(row.name);
        $('#page-reports')
            .append('<span class="centered" project-id="' + row.projectId + '">167:59:59</span>')
            .append('<span class="centered" project-id="' + row.projectId + '">167:59:59</span>')
            .append('<span class="centered" project-id="' + row.projectId + '">119:59:59</span>')
            .append('<span class="centered" project-id="' + row.projectId + '">23:59:59</span>')
            .append('<span class="centered" project-id="' + row.projectId + '">23:59:59</span>')
            .append('<span class="centered" project-id="' + row.projectId + '">23:59:59</span>');
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
        $(this).removeClass('active').html('&#x25BA;');
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

function tab(name){
    name = $(name).attr('name');

    $('body > button').removeClass('active');
    $('#tab-' + name).addClass('active');

    $('body > div').hide();
    $('#page-' + name).css('display', 'grid');
}
