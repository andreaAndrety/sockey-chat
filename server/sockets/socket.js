const { io } = require('../server');

const { Usuarios } = require('../classes/usuarios');

const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();
io.on('connection', (client) => {

    // console.log('Usuario conectado');

    client.on('entrarChat', (data, callBack) => {

        if (!data.nombre || !data.sala) {
            return callBack({
                error: true,
                mensaje: 'El nombre y sala es necesario'
            });
        }

        //conectar un usuario a una sala
        client.join(data.sala);
        //agregamos el usuario a la lista
        usuarios.agregarPersonas(client.id, data.nombre, data.sala);
        // console.log('usuario', data);
        //envia mensaje a todos para notofocar el usuario conectado
        client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));

        callBack(usuarios.getPersonasPorSala(data.sala));
    });

    client.on('crearMensaje', (data) => {

        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
    })

    client.on('disconnect', () => {
        let personaBorrada = usuarios.removerPersona(client.id);

        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Admin', `${personaBorrada.nombre} se desconecto`))
        client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
    });
    //mensajes privados

    client.on('mensajePrivado', data => {
        //saber que persona envio el mensaje
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

    });


});