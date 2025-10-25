import Turno from '../models/Turno.js';
import { buildPaginationData } from '../utils/pagination.js';

const formatFechaCorta = (fecha) => {
  if (!fecha) return '';
  const partes = fecha.split('-');

  if (partes.length !== 3) {
    return fecha;
  }

  const [anio, mes, dia] = partes;
  if (!anio || !mes || !dia) {
    return fecha;
  }

  return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${anio.slice(-2)}`;
};

const diagnosticoResaltaFila = (diagnostico) => {
  if (!diagnostico) return false;

  const normalizado = diagnostico
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return ['practica', 'limpieza', 'práctica'].some((palabra) => normalizado.includes(palabra));
};

export const getAllTurnos = async (req, res) => {
  try {
    let { page = 1, limit = 10, fecha = '' } = req.query;
    
    // Si no se especifica fecha, buscar la fecha más próxima con turnos
    if (!fecha) {
      const hoy = new Date().toISOString().split('T')[0];
      const proximoTurno = await Turno.findOne({ fecha: { $gte: hoy } })
        .sort({ fecha: 1 })
        .lean();
      
      if (proximoTurno) {
        fecha = proximoTurno.fecha;
      }
    }

    const query = fecha 
      ? { fecha }
      : {};

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { fecha: -1, hora: 1 },
      populate: {
        path: 'paciente',
        populate: {
          path: 'obraSocial'
        }
      },
      lean: true
    };

    const turnos = await Turno.paginate(query, options);

    const turnosFormateados = turnos.docs.map((turno) => {
      const resaltarFila = diagnosticoResaltaFila(turno.diagnostico);
      const turnoLibre = !turno.paciente || !turno.paciente.apellido;
      const rowClass = [
        resaltarFila ? 'bg-practica' : '',
        turnoLibre ? 'bg-turno-libre' : ''
      ].filter(Boolean).join(' ');

      return {
        ...turno,
        fechaFormateada: formatFechaCorta(turno.fecha),
        resaltarFila,
        turnoLibre,
        rowClass
      };
    });
    const fechaActualDisplay = fecha ? formatFechaCorta(fecha) : '';
    const queryParams = {
      ...req.query,
      ...(fecha ? { fecha } : {})
    };
    const { pagination, paginationDisplay, paginationQuery } = buildPaginationData(
      turnos,
      queryParams
    );

    res.render('pages/turnos', {
      title: 'Turnos',
      turnos: turnosFormateados,
      fechaActual: fecha,
      fechaActualDisplay,
      paginationQuery,
      paginationDisplay,
      pagination
    });
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).render('error', { error: 'Error al obtener turnos' });
  }
};

export const getTurnoById = async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await Turno.findById(id)
      .populate({
        path: 'paciente',
        populate: {
          path: 'obraSocial'
        }
      })
      .lean();

    if (!turno) {
      return res.status(404).render('error', { error: 'Turno no encontrado' });
    }

    res.render('pages/turnoDetalle', {
      title: `Turno - ${turno.fecha} ${turno.hora}`,
      turno
    });
  } catch (error) {
    console.error('Error al obtener turno:', error);
    res.status(500).render('error', { error: 'Error al obtener turno' });
  }
};

export const createTurno = async (req, res) => {
  try {
    const { paciente, fecha, hora, diagnostico, estado } = req.body;
    
    const newTurno = new Turno({
      paciente: paciente || undefined,
      fecha,
      hora,
      diagnostico,
      estado
    });

    await newTurno.save();
    res.redirect('/turnos');
  } catch (error) {
    console.error('Error al crear turno:', error);
    res.status(500).render('error', { error: 'Error al crear turno' });
  }
};

export const updateTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente, fecha, hora, diagnostico, estado } = req.body;

    const turno = await Turno.findByIdAndUpdate(
      id,
      { paciente, fecha, hora, diagnostico, estado },
      { new: true, runValidators: true }
    );

    if (!turno) {
      return res.status(404).render('error', { error: 'Turno no encontrado' });
    }

    res.redirect('/turnos');
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    res.status(500).render('error', { error: 'Error al actualizar turno' });
  }
};

export const deleteTurno = async (req, res) => {
  try {
    const { id } = req.params;
    const turno = await Turno.findByIdAndDelete(id);

    if (!turno) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    res.redirect('/turnos');
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    res.status(500).json({ error: 'Error al eliminar turno' });
  }
};


