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

refreshProjectNames();

function refreshProjectNames(){
    window.projectsFilename = './storage/projects.json';

    if(fs.existsSync(window.projectsFilename)) {
        window.projects = JSON.parse(fs.readFileSync(window.projectsFilename, 'utf8'));
        console.log(window.projects.projects, window.projects.highest);
    } else {
        console.log("File Doesn't Exist. Creating new file: " + window.projectsFilename);

        fs.writeFile(window.projectsFilename, '{"highest":0,"projects":[]}', (err) => {
            if(err) {
                console.log(err);
            }
        });

        window.projects = {"highest":0,"projects":[]};
    }

    window.usedColours = [];

    $('#project-list').empty();
    window.projects.projects.forEach(function(a,i){
        if(a.length < 2) return; // continue

        window.usedColours.push(a.colour);

        $('#project-list').append('<img src="./icons/clock-' + a.colour + '.png"/>');
        $('#project-list').append('<input class="project-name" project-id="' + a.id + '" placeholder="project name" value="' + a.name + '"/>');
        $('#project-list').append('<button class="project-start" project-id="' + a.id + '">&#x25BA;</button>'); //disabled //&#x25A0;
    });

    $('#project-list').append('<img src="./icons/clock-' + nextColour() + '.png"/>');
    $('#project-list').append('<input class="project-name" id="projectNew" project-id="new" placeholder="project name"/>');
    $('#project-list').append('<button disabled>&#x25BA;</button>');

    $('input.project-name').on('change', writeProjectFile);
    $('button.project-start').on('click', function(){projectStart(this);});
}

function projectStart(button){
    console.log(button);
}

function writeProjectFile(){
    $('#project-list input').each(function(){
        let projectId = $(this).attr('project-id');
        let name = $(this).val();

        window.projects.projects = updateProjectNameInArray(window.projects.projects, projectId, name);
    });

    fs.writeFileSync(window.projectsFilename, JSON.stringify(window.projects));

    refreshProjectNames();
}

function updateProjectNameInArray(array, projectId, name){
    if(name.trim() == ''){
        for(i in array){
            if(array[i].id == projectId){
                array.splice(i, 1);
                break;
            }
        }

        return array;
    }

    if(projectId == 'new'){
        window.projects.highest++;

        array.push({
            id: window.projects.highest,
            colour: nextColour(),
            name: name,
        });
    }else{
        for(i in array){
            if(array[i].id == projectId){
                array[i].name = name;
                break;
            }
        }
    }

    return array;
}

function csvDecode(string){
    a = string.split("\n");
    a.forEach(function(b,i){
        a[i] = b.split(',');
    })
    return a;
}

function nextColour(){
    let colour='black';

    for(i in colours){
        if(!window.usedColours.includes(colours[i])){
            return colours[i];
        }
    }

    return colour;
}
