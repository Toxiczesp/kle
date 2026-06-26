import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface AuthorityDateRangeFieldProps {
  startDate: string;
  endDate: string;
  label?: string;
  className?: string;
  onChange: (value: { startDate: string; endDate: string }) => void;
}

function parseDate(value: string) {
  if (!value) return undefined;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function formatLabel(value: string) {
  const parsed = parseDate(value);
  return parsed ? format(parsed, 'dd/MM/yyyy') : '';
}

export default function AuthorityDateRangeField({
  startDate,
  endDate,
  label = 'Rango de fechas',
  className = '',
  onChange,
}: AuthorityDateRangeFieldProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<Date>(start ?? new Date());

  useEffect(() => {
    if (start) {
      setVisibleMonth(start);
    }
  }, [startDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const rangeStart = startOfWeek(monthStart, { locale: es });
    const rangeEnd = endOfWeek(monthEnd, { locale: es });
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [visibleMonth]);

  const weekDayLabels = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { locale: es });
    return Array.from({ length: 7 }, (_, index) =>
      format(addDays(weekStart, index), 'EEEEE', { locale: es }).toUpperCase()
    );
  }, []);

  const buttonLabel = useMemo(() => {
    if (startDate && endDate) {
      return `${formatLabel(startDate)} - ${formatLabel(endDate)}`;
    }
    if (startDate) {
      return `${formatLabel(startDate)} - ...`;
    }
    return 'Seleccionar desde y hasta';
  }, [endDate, startDate]);

  const handleDayClick = (day: Date) => {
    if (!start || (start && end)) {
      onChange({
        startDate: formatValue(day),
        endDate: '',
      });
      return;
    }

    if (isBefore(day, start)) {
      onChange({
        startDate: formatValue(day),
        endDate: formatValue(start),
      });
      setIsOpen(false);
      return;
    }

    onChange({
      startDate: formatValue(start),
      endDate: formatValue(day),
    });
    setIsOpen(false);
  };

  const isInRange = (day: Date) => {
    if (!start || !end) return false;
    return !isBefore(day, start) && !isAfter(day, end);
  };

  const getDayClassName = (day: Date) => {
    const classes = ['authority-calendar-day'];

    if (!isSameMonth(day, visibleMonth)) {
      classes.push('is-outside-month');
    }
    if (start && isSameDay(day, start)) {
      classes.push('is-range-start');
    }
    if (end && isSameDay(day, end)) {
      classes.push('is-range-end');
    }
    if (isInRange(day)) {
      classes.push('is-in-range');
    }
    if (start && !end && isSameDay(day, start)) {
      classes.push('is-pending-end');
    }

    return classes.join(' ');
  };

  return (
    <div ref={wrapperRef} className={`form-group authority-date-range-field ${className}`.trim()}>
      <label className="form-label">{label}</label>
      <button
        type="button"
        className="authority-date-range-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{buttonLabel}</span>
        <CalendarDays size={18} />
      </button>

      {isOpen && (
        <div className="authority-date-range-popover authority-date-range-popover-custom">
          <div className="authority-calendar-header">
            <button
              type="button"
              className="authority-calendar-nav"
              onClick={() => setVisibleMonth((prev) => subMonths(prev, 1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <strong>{format(visibleMonth, 'MMMM yyyy', { locale: es })}</strong>
            <button
              type="button"
              className="authority-calendar-nav"
              onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="authority-calendar-grid authority-calendar-weekdays">
            {weekDayLabels.map((dayLabel) => (
              <span key={dayLabel} className="authority-calendar-weekday">
                {dayLabel}
              </span>
            ))}
          </div>

          <div className="authority-calendar-grid authority-calendar-days">
            {calendarDays.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                className={getDayClassName(day)}
                onClick={() => handleDayClick(day)}
              >
                {format(day, 'd')}
              </button>
            ))}
          </div>

          <div className="authority-calendar-hint">
            {!start && 'Haz clic en el dia de inicio y despues en el dia de fin.'}
            {start && !end && 'Ahora elige el dia en el que quieres terminar el rango.'}
            {start && end && 'Si haces clic en otro dia, empezarás un rango nuevo.'}
          </div>

          <div className="authority-date-range-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                onChange({ startDate: '', endDate: '' });
                setVisibleMonth(new Date());
              }}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
