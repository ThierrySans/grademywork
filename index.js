const yaml = require('js-yaml');
const axios = require('axios');
const stringify = require('csv-stringify');

if (typeof window === 'undefined'){
    const axiosCookieJarSupport = require('axios-cookiejar-support').default;
    axiosCookieJarSupport(axios);

    const tough = require('tough-cookie');
    const cookieJar = new tough.CookieJar();

    axios.defaults.jar = cookieJar;
    
    exports.init = function(url){
        axios.defaults.baseURL = url;
    }
}

axios.interceptors.request.use(function(request){
    return request;
}, function (error) {
    return Promise.reject(error);
});

axios.defaults.headers.post['Content-Type'] = 'application/json';

axios.defaults.withCredentials = true;

axios.interceptors.response.use(function(response){
    return response.data;
}, function(error){
    if ('response' in error) return Promise.reject(new Error(error.response.status + ' - ' + error.response.data));
    return Promise.reject(error);
});

let cache = {user: null, assessment: null};

let clearCache = function(data){
    cache = {user: null, assessment: null};
    return data;
}

let cacheUser = function(user) {
    cache.user = user;
    return user;
}

let cacheAssessment = function(assessment) {
    cache.assessment = assessment;
    return assessment;
}

exports.register = function(email, username){
    return axios.post('/api/register', {email, username});
}

exports.reset = function(email){
    return axios.post('/api/reset', {email});
}

exports.changePassword = function(username, password, old){
    let url = '/api/users/:username/profile/password/'
                .replace(/:username/g, username)
    return axios.patch(url, {username, old, password}).then(clearCache).then(cacheUser);
}

exports.verify = function(email, password, token){
    return axios.post('/api/verify', {email, password, token}).then(clearCache).then(cacheUser);
}

exports.login = function(email, password){
    return axios.post('/api/login', {email, password}).then(clearCache).then(cacheUser);
}

exports.logout = function(){
    return axios.get('/api/logout').then(clearCache);
}

exports.getUser = getUser = function(){
    if (cache.user) return Promise.resolve(cache.user);
    return axios.get('/api/').then(cacheUser);
}

exports.newAssessment = function(username, isPublic, caption, rubrics, sheets){
    let url = '/api/users/:username/assessments/:caption/'
                .replace(/:username/g, username)
                .replace(/:caption/g, caption)
    return axios.put(url, {isPublic, rubrics, sheets}).then(clearCache);
}

exports.getAssessment = getAssessment = function(username, assessmentCaption){
    if ((cache.assessment) && (cache.assessment.username == username) && (cache.assessment.caption == assessmentCaption)) return Promise.resolve(cache.assessment);
    let url = '/api/users/:username/assessments/:assessmentCaption/'.replace(':username', username).replace(':assessmentCaption', assessmentCaption);
    return axios.get(url).then(cacheAssessment);
}

exports.updateAssessment = function(username, assessmentCaption, caption){
    let url = '/api/users/:username/assessments/:assessmentCaption/'
           .replace(/:username/g, username)
           .replace(/:assessmentCaption/g, assessmentCaption);
    return axios.patch(url, {caption}).then(clearCache);
}

exports.getAssessmentStats = function(username, assessmentCaption){
    let url = '/api/users/:username/assessments/:assessmentCaption/stats/'
                .replace(':username', username)
                .replace(':assessmentCaption', assessmentCaption);
    return axios.get(url);
}

exports.deleteAssessment = function(username, assessmentCaption){
    let url = '/api/users/:username/assessments/:assessmentCaption/'
           .replace(/:username/g, username)
           .replace(/:assessmentCaption/g, assessmentCaption);
    return axios.delete(url).then(clearCache);
}

exports.setPublic = function(username, assessmentCaption, isPublic){
    let url = '/api/users/:username/assessments/:assessmentCaption/settings/public'
                .replace(/:username/g, username)
                .replace(/:assessmentCaption/g, assessmentCaption)
    return axios.patch(url, {isPublic}).then(clearCache);
}

exports.setArchive = function(username, assessmentCaption, isArchived){
    let url = '/api/users/:username/assessments/:assessmentCaption/settings/archive'
                .replace(/:username/g, username)
                .replace(/:assessmentCaption/g, assessmentCaption)
    return axios.patch(url, {isArchived}).then(clearCache);
}

exports.setRelease = function(username, assessmentCaption, isReleased){
    let url = '/api/users/:username/assessments/:assessmentCaption/settings/release'
                .replace(/:username/g, username)
                .replace(/:assessmentCaption/g, assessmentCaption)
    return axios.patch(url, {isReleased}).then(clearCache);
}

exports.setAnswer = function(username, assessmentCaption, sheet, question, answer){
    let url = '/api/users/:username/assessments/:assessmentCaption/sheets/:sheet/questions/:question/'
                .replace(/:username/g, username)
                .replace(/:assessmentCaption/g, assessmentCaption)
                .replace(/:sheet/g, sheet)
                .replace(/:question/g, question)
    return axios.post(url, {answer});
}

exports.getSheet = getSheet = function(username, assessmentCaption, sheet){
    let url = '/api/users/:username/assessments/:assessmentCaption/sheets/:sheet/'
                .replace(/:username/g, username)
                .replace(/:assessmentCaption/g, assessmentCaption)
                .replace(/:sheet/g, sheet)
    return axios.get(url);
}

exports.addSheet = function(username, assessmentCaption, caption){
    let url = '/api/users/:username/assessments/:assessmentCaption/sheets/'
           .replace(/:username/g, username)
    .replace(/:assessmentCaption/g, assessmentCaption);
    return axios.post(url, {caption}).then(clearCache);
}

exports.updateSheet = function(username, assessmentCaption, sheet, caption){
    let url = '/api/users/:username/assessments/:assessmentCaption/sheets/:sheet/'
           .replace(/:username/g, username)
           .replace(/:assessmentCaption/g, assessmentCaption)
           .replace(/:sheet/g, sheet);
    return axios.patch(url, {caption}).then(clearCache);
}

exports.deleteSheet = function(username, assessmentCaption, sheet){
     let url = '/api/users/:username/assessments/:assessmentCaption/sheets/:sheet/'
            .replace(/:username/g, username)
            .replace(/:assessmentCaption/g, assessmentCaption)
            .replace(/:sheet/g, sheet);
     return axios.delete(url).then(clearCache);
}

exports.getPrivileges = function(username, assessmentCaption, sheet){
    let url = '/api/users/:username/assessments/:assessmentCaption/sheets/:sheet/privileges'
                .replace(/:username/g, username)
                .replace(/:assessmentCaption/g, assessmentCaption)
                .replace(/:sheet/g, sheet)
    return axios.get(url);
}

exports.addPrivilege = function(username, assessmentCaption, sheet, email, type){
     let url = '/api/users/:username/assessments/:assessmentCaption/sheets/:sheet/privileges'
                .replace(/:username/g, username)
                .replace(/:assessmentCaption/g, assessmentCaption)
        .replace(/:sheet/g, sheet);
     return axios.put(url, {email, type}).then(clearCache);
}

exports.deletePrivilege = function(username, assessmentCaption, sheet, email, type){
     let url = '/api/users/:username/assessments/:assessmentCaption/sheets/:sheet/privileges'
            .replace(/:username/g, username)
            .replace(/:assessmentCaption/g, assessmentCaption)
            .replace(/:sheet/g, sheet);
     return axios.delete(url, {data: {email, type}}).then(clearCache);
}

// exports.exportSummaryTo2CSV = async function (username, assessmentCaption){
//
// }
//
// exports.exportPrivilegesTo2CSV = async function (username, assessmentCaption){
//
// }
//
//
// exports.exportSheetsTo2CSV = async function (username, assessmentCaption){
//     let user = await getUser();
//     let assessment = await getAssessment(username, assessmentCaption);
//     let questions = assessment.rubrics.reduce(function(acc, rubric){
//         rubric.questions.forEach(function(question){
//             acc[question.id] = {rubric: rubric.caption, question: question.caption, type: question.type, params: question.params};
//         });
//         return acc;
//     }, {});
//     let key = username + '/' + assessmentCaption;
//     let sheets = user.privileges[key].sheets;
//     let records = [];
//     for (let sheet of Object.values(sheets)){
//         let sheetData = await getSheet(username, assessmentCaption, sheet.id);
//         let base = {assessment: key, sheet: sheet.caption}
//         sheetData.answers.forEach(function(answer){
//             records.push({...base, ...questions[answer.questionId], ...{answer: answer.value}});
//         });
//     };
//     let config = {
//             header: true,
//             columns: ['assessment', 'sheet', 'rubric', 'question', 'type', 'params', 'answer']
//     };
//     return new Promise(function(resolve, reject){
//         stringify(records, config, function(err, data){
//             if (err) return reject(err);
//             return resolve(data);
//         });
//     });
// };