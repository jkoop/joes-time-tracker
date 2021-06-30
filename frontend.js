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

        window.usedColours.push(a[1]);

        $('#project-list').append('<img src="./icons/clock-' + a[1] + '.png"/>');
        $('#project-list').append('<input class="project-name" id="project' + a[0] + '" project-id="' + a[0] + '" placeholder="project name" value="' + a[2] + '"/>');
        $('#project-list').append('<button>&#x25BA;</button>'); //disabled //&#x25A0;
    });

    $('#project-list').append('<img src="./icons/clock-' + nextColour() + '.png"/>');
    $('#project-list').append('<input class="project-name" id="projectNew" project-id="new" placeholder="project name"/>');
    $('#project-list').append('<button disabled>&#x25BA;</button>');

    $('input.project-name').on('change', writeProjectFile);
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
            if(array[i][0] == projectId){
                array.splice(i, 1);
                break;
            }
        }

        return array;
    }

    if(projectId == 'new'){
        window.projects.highest++;

        array.push([
            window.projects.highest,
            nextColour(),
            name,
        ]);
    }else{
        for(i in array){
            if(array[i][0] == projectId){
                array[i][2] = name;
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

function csvEncode(array){
    a = [];
    array.forEach(function(b,i){
        if(typeof b == 'array'){
            a.push(b.join(','));
        }
    })
    a = a.join("\n");
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
