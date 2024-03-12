const express = require('express')

const app = express()
const port = 3000

app.get('/:formId/filteredResponses', (req, res) => {
    const formId = req.params.formId;
    const {filters, ...otherParams} = req.query
    
    // setup pass through query param string
    const queryParams = Object.entries(otherParams).reduce((acc, entry) => {
        if(acc === "") {
            return acc + `?${entry[0]}=${entry[1]}`
        }else {
            return acc + `&${entry[0]}=${entry[1]}`
        }
    },"");

    const parsedFilters = JSON.parse(req.query?.filters ?? JSON.stringify([]));

    fetch(`https://api.fillout.com/v1/api/forms/${formId}/submissions${queryParams}`,{
        method: "GET",
        headers: {
            "Authorization": req.headers.authorization,
        },
    }).then(resp =>  resp.json()).then(resp => {
        const responses = resp.responses; 

        if(parsedFilters === undefined || parsedFilters.length === 0) {
            res.send(responses);
            return;
        }

        // filter responses
        const filtered = responses.filter(resp => {
            const questions = resp.questions;
            return parsedFilters.reduce((acc, filter) => {
                if(questions.some(q => q.id === filter.id)){
                    // check each of the questions for passing each filter 
                    return questions.reduce((qAcc, question) => {
                        if(question.id === filter.id) {
                            switch (filter.condition) {
                                case "equals":
                                    if(question.value !== filter.value) {
                                        return false;
                                    } else {
                                        return qAcc;
                                    }
                                    break;
                                case "does_not_equal":
                                    if(question.value === filter.value) {
                                        return false;
                                    } else {
                                        return qAcc;
                                    }
                                    break;
                                case "greater_than":
                                    if(question.value < filter.value) {
                                        return false;
                                    } else {
                                        return qAcc;
                                    }
                                    break;
                                case "less_than":
                                    if(question.value > filter.value) {
                                        return false;
                                    } else {
                                        return qAcc;
                                    }
                                    break;
                            }
                        } else{
                            return qAcc;
                        }
                    }, true);
                } else {
                    return false;
                }
                return acc;
            }, true)
        })
        res.send(filtered);
    });

})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
  })