var SERVER_NAME = 'coffeeserver'

var http = require('http');
var mongoose = require("mongoose");

var uristring =
    process.env.MONGODB_URI ||
    'mongodb://admin:asdfjkl1@ds141464.mlab.com:41464/heroku_wtr4b5kp';

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
    if (err) {
        console.log('ERROR connecting to: ' + uristring + '. ' + err);
    } else {
        console.log('Successfully connected to: ' + uristring);
    }
});

// This is the schema.  Note the types, validation and trim
// statements.  They enforce useful constraints on the data.
var customerSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    address: String,
    phone: String
});

var orderSchema = new mongoose.Schema({
    customer_id: String,
    type: String,
    weight: String,
    date_create: String,
    date_delivery: String
});

// Compiles the schema into a model, opening (or creating, if
// nonexistent) the 'Customers' collection in the MongoDB database
var Customer = mongoose.model('Customer', customerSchema);
var Order = mongoose.model('Order', orderSchema);

var restify = require('restify')
// Create the restify server
    , server = restify.createServer({name: SERVER_NAME})

server.listen(process.env.PORT, process.env.IP, function () {
    console.log('Server %s listening at %s', server.name, server.url)
    console.log('Resources:')
    console.log(' /Customer')
    console.log(' /Customer/:id')
    console.log(' /Order')
    console.log(' /Order/:id')
})


server
// Allow the use of POST
    .use(restify.fullResponse())

    // Maps req.body to req.params so there is no switching between them
    .use(restify.bodyParser())

// Get all Customers in the system
server.get('/Customer', function (req, res, next) {
    console.log('GET request: Customer');
    // Find every entity within the given collection
    Customer.find({}).exec(function (error, result) {
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))
        res.send(result);
    });
})

server.get('/Order', function (req, res, next) {
    console.log('GET request: Order');
    // Find every entity within the given collection
    Order.find({}).exec(function (error, result) {
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))
        res.send(result);
    });
})

server.get('/Order/Customer/:customer_id', function (req, res, next) {
    console.log('GET request: /Order/Customer/:customer_id' + req.params.customer_id);

    // Find a single Customer by their id
    Order.find({customer_id: req.params.customer_id}).exec(function (error, Order) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        if (Order) {
            // Send the Customer if no issues
            res.send(Order)
        } else {
            // Send 404 header if the Customer doesn't exist
            res.send(404)
        }
    })
})

// Get a single Customer by their Customer id
server.get('/Customer/:id', function (req, res, next) {
    console.log('GET request: Customer/' + req.params.id);

    // Find a single Customer by their id
    Customer.find({_id: req.params.id}).exec(function (error, Customer) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        if (Customer) {
            // Send the Customer if no issues
            res.send(Customer)
        } else {
            // Send 404 header if the Customer doesn't exist
            res.send(404)
        }
    })
})

server.get('/Order/:id', function (req, res, next) {
    console.log('GET request: Order/' + req.params.id);

    // Find a single Customer by their id
    Order.find({_id: req.params.id}).exec(function (error, Order) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        if (Order) {
            // Send the Customer if no issues
            res.send(Order)
        } else {
            // Send 404 header if the Customer doesn't exist
            res.send(404)
        }
    })
})

// Create a new Customer
server.post('/Customer', function (req, res, next) {
    console.log('POST request: Customer');
    // Make sure name is defined
    if (req.params.first_name === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('first_name must be supplied'))
    }
    if (req.params.last_name === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('last_name must be supplied'))
    }
    if (req.params.address === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('address must be supplied'))
    }
    if (req.params.phone === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('phone must be supplied'))
    }

    // Creating new Customer.
    var newCustomer = new Customer({
        first_name: req.params.first_name,
        last_name: req.params.last_name,
        address: req.params.address,
        phone: req.params.phone
    });

    // Create the Customer and saving to db
    newCustomer.save(function (error, result) {

        // If there are any errors, pass them to next in the correct format
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        // Send the Customer if no issues
        res.send(201, result)
    })
})

//new
server.put('/Order/:id', function (req, res, next) {
    console.log('put request: Order/:id' + req.params.id);

    var data = req.body || {}

    if (!data._id) {
        _.extend(data, {
            _id: req.params.id
        })
    }

    Order.findOne({_id: req.params.id}, function(err, doc) {

        if (err) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        } else if (!doc) {
            return next(new errors.ResourceNotFoundError('The resource you requested could not be found.'))
        }

        Order.update({ _id: data._id }, data,{ runValidators: true }, function(err) {

            if (err) {
                if (err.name == 'ValidationError') {
                    res.send(400, {"error":err.name})
                }
                else {
                    log.error(err)
                    return next(new errors.InvalidContentError(err.errors.name.message))
                }
            }
            else { // no errors
                res.send(200, data)
                next()
            }
        })
    })
})


server.put('/Customer/:id', function(req, res, next) {
    console.log('put request: Customer/:id' + req.params.id);

    var data = req.body || {}

    if (!data._id) {
        _.extend(data, {
            _id: req.params.id
        })
    }

    Customer.findOne({_id: req.params.id}, function(err, doc) {

        if (err) {
            log.error(err)
            return next(new errors.InvalidContentError(err.errors.name.message))
        } else if (!doc) {
            return next(new errors.ResourceNotFoundError('The resource you requested could not be found.'))
        }

        Customer.update({ _id: data._id }, data,{ runValidators: true }, function(err) {

            if (err) {
                if (err.name == 'ValidationError') {
                    res.send(400, {"error":err.name})
                }
                else {
                    log.error(err)
                    return next(new errors.InvalidContentError(err.errors.name.message))
                }
            }
            else { // no errors
                res.send(200, data)
                next()
            }
        })
    })
})

server.post('/Order', function (req, res, next) {
    console.log('POST request: Order');
    // Make sure name is defined
    if (req.params.customer_id === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('customer_id must be supplied'))
    }
    if (req.params.type === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('type must be supplied'))
    }
    if (req.params.weight === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('weight must be supplied'))
    }
    if (req.params.date_create === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('date_create must be supplied'))
    }
    if (req.params.date_delivery === undefined) {
        // If there are any errors, pass them to next in the correct format
        return next(new restify.InvalidArgumentError('date_delivery must be supplied'))
    }

    // Creating new Customer.
    var newOrder = new Order({
        customer_id: req.params.customer_id,
        type: req.params.type,
        weight: req.params.weight,
        date_create: req.params.date_create,
        date_delivery: req.params.date_delivery
    });

    // Create the Customer and saving to db
    newOrder.save(function (error, result) {

        // If there are any errors, pass them to next in the correct format
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        // Send the Customer if no issues
        res.send(201, result)
    })
})

// Delete Customer with the given id
server.del('/Customer/:id', function (req, res, next) {
    console.log('DEL request: Customer/' + req.params.id);
    Customer.remove({_id: req.params.id}, function (error, result) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        // Send a 200 OK response
        res.send()
    });
})

server.del('/Order/:id', function (req, res, next) {
    console.log('DEL request: Order/' + req.params.id);
    Order.remove({_id: req.params.id}, function (error, result) {
        // If there are any errors, pass them to next in the correct format
        if (error) return next(new restify.InvalidArgumentError(JSON.stringify(error.errors)))

        // Send a 200 OK response
        res.send()
    });
})