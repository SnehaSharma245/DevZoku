import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

interface Team {
  id: string;
  name: string;
}

interface MarkingWinnerPopupProps {
  open: boolean;
  teams: Team[];
  onSubmit: (winners: {
    winner: string | null;
    firstRunnerUp: string | null;
    secondRunnerUp: string | null;
  }) => void;
  onClose: () => void;
}

const StepSeparator = () => (
  <div className="w-full flex items-center my-4">
    <div className="flex-grow border-t border-[#FF9466]" />
  </div>
);

type FormValues = {
  winner: string | null;
  firstRunnerUp: string | null;
  secondRunnerUp: string | null;
};

const MarkingWinnerPopup: React.FC<MarkingWinnerPopupProps> = ({
  open,
  teams,
  onSubmit,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: {
      winner: null,
      firstRunnerUp: null,
      secondRunnerUp: null,
    },
  });

  const winner = watch("winner");
  const firstRunnerUp = watch("firstRunnerUp");
  const secondRunnerUp = watch("secondRunnerUp");

  // Filtered teams for each step
  const filteredTeamsForWinner = teams.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeamsForFirstRunnerUp = teams
    .filter((team) => team.id !== winner)
    .filter((team) => team.name.toLowerCase().includes(search.toLowerCase()));

  const filteredTeamsForSecondRunnerUp = teams
    .filter((team) => team.id !== winner && team.id !== firstRunnerUp)
    .filter((team) => team.name.toLowerCase().includes(search.toLowerCase()));

  const onFormSubmit = (data: FormValues) => {
    onSubmit({
      winner: data.winner,
      firstRunnerUp: data.firstRunnerUp,
      secondRunnerUp: data.secondRunnerUp,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" w-full  bg-gradient-to-br from-white via-white to-[#fff9f5] border border-[#fff9f5] rounded-2xl shadow-xl p-4 sm:p-8 flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="text-center text-[#FF6F61] text-2xl font-bold mb-2">
            Mark Winners
          </DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border border-[#FF9466] rounded-xl"
        />
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Step 1: Winner */}
          {step === 1 && (
            <>
              <div>
                <h4 className="text-lg font-bold text-[#FF9466] mb-2">
                  Step 1: Select Winner
                </h4>
                <div className="space-y-2">
                  {filteredTeamsForWinner.map((team) => (
                    <label
                      key={team.id}
                      className={`block rounded-xl px-3 py-2 cursor-pointer border ${
                        winner === team.id
                          ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466] font-semibold"
                          : "bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-[#fff9f5] hover:border-[#FF9466]"
                      }`}
                    >
                      <input
                        type="radio"
                        {...register("winner", { required: true })}
                        value={team.id}
                        checked={winner === team.id}
                        onChange={() => setValue("winner", team.id)}
                        className="mr-2 accent-[#FF9466]"
                      />
                      {team.name}
                    </label>
                  ))}
                  {filteredTeamsForWinner.length === 0 && (
                    <div className="text-[#6B7A8F] text-sm mt-2">
                      No teams found.
                    </div>
                  )}
                </div>
              </div>
              <StepSeparator />
              <DialogFooter className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!winner}
                  className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:opacity-90"
                >
                  Next
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 2: First Runner Up */}
          {step === 2 && (
            <>
              <div>
                <h4 className="text-lg font-bold text-[#FF9466] mb-2">
                  Step 2: Select First Runner Up
                </h4>
                <div className="space-y-2">
                  {filteredTeamsForFirstRunnerUp.map((team) => (
                    <label
                      key={team.id}
                      className={`block rounded-xl px-3 py-2 cursor-pointer border ${
                        firstRunnerUp === team.id
                          ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466] font-semibold"
                          : "bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-[#fff9f5] hover:border-[#FF9466]"
                      }`}
                    >
                      <input
                        type="radio"
                        {...register("firstRunnerUp", { required: true })}
                        value={team.id}
                        checked={firstRunnerUp === team.id}
                        onChange={() => setValue("firstRunnerUp", team.id)}
                        className="mr-2 accent-[#FF9466]"
                      />
                      {team.name}
                    </label>
                  ))}
                  {filteredTeamsForFirstRunnerUp.length === 0 && (
                    <div className="text-[#6B7A8F] text-sm mt-2">
                      No teams found.
                    </div>
                  )}
                </div>
              </div>
              <StepSeparator />
              <DialogFooter className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!firstRunnerUp}
                  className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:opacity-90"
                >
                  Next
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 3: Second Runner Up */}
          {step === 3 && (
            <>
              <div>
                <h4 className="text-lg font-bold text-[#FF9466] mb-2">
                  Step 3: Select Second Runner Up
                </h4>
                <div className="space-y-2">
                  {filteredTeamsForSecondRunnerUp.map((team) => (
                    <label
                      key={team.id}
                      className={`block rounded-xl px-3 py-2 cursor-pointer border ${
                        secondRunnerUp === team.id
                          ? "bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white border-[#FF9466] font-semibold"
                          : "bg-gradient-to-r from-[#fff9f5] to-[#fff9f5] text-[#062a47] border-[#fff9f5] hover:border-[#FF9466]"
                      }`}
                    >
                      <input
                        type="radio"
                        {...register("secondRunnerUp", { required: true })}
                        value={team.id}
                        checked={secondRunnerUp === team.id}
                        onChange={() => setValue("secondRunnerUp", team.id)}
                        className="mr-2 accent-[#FF9466]"
                      />
                      {team.name}
                    </label>
                  ))}
                  {filteredTeamsForSecondRunnerUp.length === 0 && (
                    <div className="text-[#6B7A8F] text-sm mt-2">
                      No teams found.
                    </div>
                  )}
                </div>
              </div>
              <StepSeparator />
              <DialogFooter className="flex justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:opacity-90"
                  disabled={!secondRunnerUp}
                >
                  Submit
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MarkingWinnerPopup;
