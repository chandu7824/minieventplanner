const Loading = ({ name }) => {
  return (
    <>
      <style>
        {`
            .circle{
                height: 70px;
                width: 70px;
                border: 7px solid #42ab49;
                border-top-color: transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;                
            }
            @keyframes spin{
                from{
                    transform: rotate(0deg);
                } to {
                    transform: rotate(360deg);
                }
            }
        `}
      </style>
      <div className="backdrop-blur-lg bg-white/30 fixed z-[998] top-0 left-0 w-full h-full flex items-center justify-center">
        <div className="h-[250px] w-[250px] shadow-2xl bg-white-300 z-[999] absolute top-1/2 left-1/2 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-lg flex-col">
          <div className="circle"></div>
          <p className=" text-bold content-center text-lg text-green-700">
            {name}
          </p>
        </div>
      </div>
    </>
  );
};

export default Loading;
