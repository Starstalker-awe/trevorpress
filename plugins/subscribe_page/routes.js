import express from 'express';

const [app, use] = [express.Router(), '/'];

app.get('/subscribe', (req, res)=>{
    return res.render('subscribe.njk')
});

export {app, use};