"use client";
import { useForm } from "react-hook-form";
export type NeedForm = { sport: string; position?: string; ageMin?: number; ageMax?: number; level?: string; };
export function NeedForm({ onSubmit }:{ onSubmit:(v:NeedForm)=>void }){
  const { register, handleSubmit } = useForm<NeedForm>({ defaultValues:{ sport: "football" } });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 max-w-md">
      <input placeholder="Sport" {...register("sport")} className="border p-2 rounded" />
      <input placeholder="Position" {...register("position")} className="border p-2 rounded" />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" placeholder="Age min" {...register("ageMin", { valueAsNumber: true })} className="border p-2 rounded" />
        <input type="number" placeholder="Age max" {...register("ageMax", { valueAsNumber: true })} className="border p-2 rounded" />
      </div>
      <input placeholder="Level" {...register("level")} className="border p-2 rounded" />
      <button className="bg-black text-white rounded px-4 py-2">View Matches</button>
    </form>
  );
}
