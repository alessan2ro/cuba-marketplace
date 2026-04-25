import { CarFront, Cherry, Dumbbell, Hamburger, Lamp, LucideIcon, MonitorSmartphone, Package, Panda, PawPrint, Shirt } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    'Electrónica': MonitorSmartphone,
    'Ropa y Calzado': Shirt,
    'Belleza': Cherry,
    'Alimentos': Hamburger,
    'Hogar y Muebles': Lamp,
    'Deporte': Dumbbell,
    'Tienda de mascotas': PawPrint,
    'Vehículos': CarFront,
    'Juguetes': Panda,

};

export function getCategoryIcon(name: string): LucideIcon {
    return iconMap[name] ?? Package;
}